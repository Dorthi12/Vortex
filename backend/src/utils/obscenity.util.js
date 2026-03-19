// utils/moderationUtils.js
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });

export const checkImageModeration = async (s3Key) => {
  const { ModerationLabels } = await rekognition.send(
    new DetectModerationLabelsCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: s3Key,
        },
      },
      MinConfidence: 75,
    }),
  );

  return {
    isFlagged: ModerationLabels.length > 0,
    labels: ModerationLabels.map((l) => l.Name),
  };
};

export const checkMultipleImages = async (s3Keys) => {
  if (!Array.isArray(s3Keys)) {
    s3Keys = [s3Keys];
  }

  const results = await Promise.all(
    s3Keys.map((key) => checkImageModeration(key)),
  );

  for (let i = 0; i < results.length; i++) {
    if (results[i].isFlagged) {
      return {
        isFlagged: true,
        flaggedKey: s3Keys[i],
        labels: results[i].labels,
      };
    }
  }

  return { isFlagged: false, labels: [] };
};

export const cleanupS3Objects = async (keys) => {
  if (!Array.isArray(keys)) {
    keys = [keys]; // convert single key to array
  }
  await Promise.all(
    keys.map((key) =>
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
        }),
      ),
    ),
  );
};
