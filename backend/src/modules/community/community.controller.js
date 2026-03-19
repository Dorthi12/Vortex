import prisma from "../../config/db.js";
import { sendKafkaMessage } from "../../utils/kafka.utils.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import s3Client from "../../config/s3.js";
import {
  checkMultipleImages,
  cleanupS3Objects,
} from "../../utils/obscenity.util.js";

export const generateUploadUrls = async (req, res, next) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: "Files array required",
      });
    }
    const allowedTypes = ["image/png", "image/jpeg"];

    const results = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.fileType)) {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type",
        });
      }
      const extension = path.extname(file.fileName);
      const key = `posts/${crypto.randomUUID()}${extension}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: file.fileType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300,
      });

      results.push({
        key,
        uploadUrl,
      });
    }

    res.json({
      success: true,
      files: results,
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { caption, locationName, latitude, longitude, mediaKeys } = req.body;
    if (mediaKeys && mediaKeys.length > 0) {
      const { isFlagged, labels } = await checkMultipleImages(mediaKeys);
      if (isFlagged) {
        await cleanupS3Objects(mediaKeys);
        return res.status(400).json({
          success: false,
          error: "One or more images contain inappropriate content.",
          flags: labels,
        });
      }
    }
    const post = await prisma.post.create({
      data: {
        caption,
        locationName,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        authorId: req.user.id,

        media:
          mediaKeys && mediaKeys.length > 0
            ? {
                create: mediaKeys.map((key) => ({
                  awsS3ObjectKey: key,
                  publicId: key,
                  type:
                    key.endsWith(".mp4") || key.endsWith(".webm")
                      ? "VIDEO"
                      : "IMAGE",
                })),
              }
            : undefined,
      },
      include: {
        media: true,
      },
    });

    const kafkaPayload = {
      postId: post.id,
      userId: req.user.id,
      caption: post.caption,
      locationName: post.locationName,
      latitude: post.latitude,
      longitude: post.longitude,
      mediaKeys: mediaKeys || [],
    };

    await sendKafkaMessage("post-created", kafkaPayload);

    const mediaWithUrls = post.media.map((media) => ({
      ...media,
      url: `${process.env.AWS_S3_BASE_URL}/${media.awsS3ObjectKey}`,
    }));
    res.status(201).json({
      success: true,
      post: {
        ...post,
        media: mediaWithUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeed = async (req, res, next) => {
  try {
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            awsS3ObjectKey: true,
          },
        },
        media: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    const postsWithUrls = posts.map((post) => ({
      ...post,

      author: {
        ...post.author,
        profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${post.author.awsS3ObjectKey}`,
      },

      media: post.media.map((m) => ({
        ...m,
        url: `${process.env.AWS_S3_BASE_URL}/${m.awsS3ObjectKey}`,
      })),
    }));

    const nextCursor = posts.length ? posts[posts.length - 1].id : null;

    res.json({
      success: true,
      posts: postsWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        media: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    const postsWithUrls = posts.map((post) => ({
      ...post,
      media: post.media.map((m) => ({
        ...m,
        url: `${process.env.AWS_S3_BASE_URL}/${m.awsS3ObjectKey}`,
      })),
    }));

    const nextCursor = posts.length ? posts[posts.length - 1].id : null;

    res.json({
      success: true,
      posts: postsWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const votePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { type } = req.body;

    const vote = await prisma.vote.upsert({
      where: {
        postId_userId: {
          postId,
          userId: req.user.id,
        },
      },
      update: { type },
      create: {
        postId,
        userId: req.user.id,
        type,
      },
    });

    res.json({
      success: true,
      vote,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostVotes = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const votes = await prisma.vote.findMany({
      where: { postId },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            awsS3ObjectKey: true,
          },
        },
      },
    });

    const votesWithUrls = votes.map((vote) => ({
      ...vote,
      user: {
        ...vote.user,
        profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${vote.user.awsS3ObjectKey}`,
      },
    }));

    const nextCursor = votes.length ? votes[votes.length - 1].id : null;

    res.json({
      success: true,
      votes: votesWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: req.user.id,
        content,
        parentId: parentId || null,
      },
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { parentId, cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: parentId ?? null,
      },
      orderBy: { createdAt: "desc" },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            awsS3ObjectKey: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    const commentsWithUrls = comments.map((comment) => ({
      ...comment,
      author: {
        ...comment.author,
        profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${comment.author.awsS3ObjectKey}`,
      },
    }));

    const nextCursor = comments.length
      ? comments[comments.length - 1].id
      : null;

    res.json({
      success: true,
      comments: commentsWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            role: true,
            awsS3ObjectKey: true,
          },
        },
      },
    });

    const followersWithUrls = followers.map((f) => ({
      ...f,
      follower: {
        ...f.follower,
        profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${f.follower.awsS3ObjectKey}`,
      },
    }));

    const nextCursor = followers.length
      ? followers[followers.length - 1].id
      : null;

    res.json({
      success: true,
      followers: followersWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            name: true,
            role: true,
            awsS3ObjectKey: true,
          },
        },
      },
    });

    const followingWithUrls = following.map((f) => ({
      ...f,
      following: {
        ...f.following,
        profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${f.following.awsS3ObjectKey}`,
      },
    }));

    const nextCursor = following.length
      ? following[following.length - 1].id
      : null;

    res.json({
      success: true,
      following: followingWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    if (userId === followerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    res.status(201).json({
      success: true,
      follow,
    });
  } catch (error) {
    next(error);
  }
};
export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(404).json({
        success: false,
        message: "You are not following this user",
      });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    res.json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const getSentimentAnalysis = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
