import prisma from "../../config/db.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import s3Client from "../../config/s3.js";
import {
  checkMultipleImages,
  cleanupS3Objects,
} from "../../utils/obscenity.util.js";

export const getUserInfo = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        awsS3ObjectKey: true,
        Department: true,
        city: true,
        state: true,
        position: true,
        themePreference: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profileImageUrl = `${process.env.AWS_S3_BASE_URL}/${user.awsS3ObjectKey}`;

    res.status(200).json({
      success: true,
      user: {
        ...user,
        profileImageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName and fileType are required",
      });
    }

    const allowedTypes = ["image/png", "image/jpeg", "video/mp4"];

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    const extension = path.extname(fileName);

    const key = `uploads/${crypto.randomUUID()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    res.json({
      success: true,
      key,
      uploadUrl,
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
    if (req.body.key) {
      const { isFlagged, labels } = await checkMultipleImages(req.body.key);
      if (isFlagged) {
        await cleanupS3Objects(req.body.key);
        return res.status(400).json({
          success: false,
          error: "Image contains inappropriate content.",
          flags: labels,
        });
      }
      updateData.awsS3ObjectKey = req.body.key;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phoneNumber: true,
        role: true,
        dateOfBirth: true,
        awsS3ObjectKey: true,
        themePreference: true,
        authProvider: true,
        city: true,
        state: true,
      },
    });

    const response = {
      ...updatedUser,
      profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${updatedUser.awsS3ObjectKey}`,
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
      filters.push({ role });
    }

    if (department) {
      filters.push({ department });
    }

    if (city) {
      filters.push({ city });
    }

    if (state) {
      filters.push({ state });
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
        awsS3ObjectKey: true,
      },
    });

    const usersWithUrls = users.map((user) => ({
      ...user,
      profileImageUrl: `${process.env.AWS_S3_BASE_URL}/${user.awsS3ObjectKey}`,
    }));

    const nextCursor = users.length ? users[users.length - 1].id : null;

    res.json({
      success: true,
      users: usersWithUrls,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};
