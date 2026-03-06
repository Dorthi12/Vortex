import prisma from "../../config/db.js";

export const createPost = async (req, res, next) => {
  try {
    const { caption, locationName, latitude, longitude } = req.body;

    const post = await prisma.post.create({
      data: {
        caption,
        locationName,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        authorId: req.user.id,
      },
    });

    if (req.filesData && req.filesData.length > 0) {
      await prisma.postMedia.createMany({
        data: req.filesData.map((file) => ({
          postId: post.id,
          url: file.url,
          type: file.type,
        })),
      });
    }

    res.status(201).json({
      success: true,
      post,
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
            profileImageUrl: true,
            role: true,
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
    const nextCursor = posts.length ? posts[posts.length - 1].id : null;
    res.json({
      success: true,
      posts,
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

    const nextCursor = posts.length ? posts[posts.length - 1].id : null;
    res.json({
      success: true,
      posts,
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
            profileImageUrl: true,
            role: true,
          },
        },
      },
    });

    const nextCursor = votes.length ? votes[votes.length - 1].id : null;
    res.json({
      success: true,
      votes,
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
    const { parentId } = req.query;

    const { cursor } = req.query;
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
            profileImageUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    const nextCursor = comments.length
      ? comments[comments.length - 1].id
      : null;
    res.json({
      success: true,
      comments,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { cursor } = req.cursor;
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
            profileImageUrl: true,
            role: true,
          },
        },
      },
    });

    const nextCursor = followers.length
      ? followers[followers.length - 1].id
      : null;
    res.json({
      success: true,
      followers,
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
            profileImageUrl: true,
            role: true,
          },
        },
      },
    });

    const nextCursor = following.length
      ? following[following.length - 1].id
      : null;
    res.json({
      success: true,
      following,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};
