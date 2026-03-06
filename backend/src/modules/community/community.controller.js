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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: true,
        media: true,
        votes: true,
        comments: true,
      },
    });

    res.json({
      success: true,
      page,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        media: true,
        votes: true,
        comments: true,
      },
    });

    res.json({
      success: true,
      posts,
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

    const votes = await prisma.vote.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    });

    res.json({
      success: true,
      votes,
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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: true,
        replies: {
          include: {
            author: true,
          },
        },
      },
    });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    });

    res.json({
      success: true,
      followers,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    });

    res.json({
      success: true,
      following,
    });
  } catch (error) {
    next(error);
  }
};
