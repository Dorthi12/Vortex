import prisma from "../../config/db.js";

export const getUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        profileImageUrl: true,
        themePreference: true,
        authProvider: true,
        city: true,
        state: true,
        _count: {
          select: {
            followers: true,
            following: true,
            issueReports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      phoneNumber: user.phoneNumber,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      profileImageUrl: user.profileImageUrl,
      themePreference: user.themePreference,
      authProvider: user.authProvider,
      city: user.city,
      state: user.state,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      issueReportsCount: user._count.issueReports,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const allowedFields = [
      "name",
      "gender",
      "phoneNumber",
      "dateOfBirth",
      "profileImageUrl",
      "themePreference",
      "city",
      "state",
    ];

    const updateData = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        profileImageUrl: true,
        themePreference: true,
        authProvider: true,
        city: true,
        state: true,
      },
    });
    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      gender: updatedUser.gender,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      dateOfBirth: updatedUser.dateOfBirth,
      profileImageUrl: updatedUser.profileImageUrl,
      themePreference: updatedUser.themePreference,
      authProvider: updatedUser.authProvider,
      city: updatedUser.city,
      state: updatedUser.state,
    };
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { q, role, department, city, state, cursor } = req.query;
    const limit = Number(req.query.limit) || 10;

    const filters = [];

    if (q) {
      filters.push({
        OR: [
          {
            name: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (role) {
      filters.push({
        role: role,
      });
    }
    if (department) {
      filters.push({
        department: department,
      });
    }
    if (city) {
      filters.push({
        city: city,
      });
    }
    if (state) {
      filters.push({
        state: state,
      });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: filters,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        city: true,
        state: true,
        profileImageUrl: true,
      },
    });

    const nextCursor = users.length ? users[users.length - 1].id : null;

    res.json({
      success: true,
      users,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};
