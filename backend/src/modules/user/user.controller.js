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
import prisma from "../../generated/client.js";

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
