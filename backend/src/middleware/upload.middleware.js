import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

export const uploadSingle = (fieldName, folder = "profile") => [
  upload.single(fieldName),

  async (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64",
      )}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder,
        resource_type: "auto",
      });

      req.fileUrl = result.secure_url;
      req.filePublicId = result.public_id;

      next();
    } catch (error) {
      next(error);
    }
  },
];

export const uploadMultiple = (fieldName, maxCount = 5, folder = "posts") => [
  upload.array(fieldName, maxCount),

  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        req.filesData = [];
        return next();
      }

      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
            "base64",
          )}`;

          const result = await cloudinary.uploader.upload(base64, {
            folder,
            resource_type: "auto",
          });

          return {
            url: result.secure_url,
            publicId: result.public_id,
            type: file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
          };
        }),
      );

      req.filesData = uploads;

      next();
    } catch (error) {
      next(error);
    }
  },
];
