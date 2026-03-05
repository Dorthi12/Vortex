import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadSingle = (fieldName, folder = "uploads") => [
  upload.single(fieldName),

  async (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder,
      });

      req.fileUrl = result.secure_url;
      req.filePublicId = result.public_id;

      next();
    } catch (error) {
      next(error);
    }
  },
];
