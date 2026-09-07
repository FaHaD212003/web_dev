import * as Minio from "minio";
import env from "dotenv";

env.config();

export const BUCKET_NAME = process.env.MINIO_BUCKET || "task-attachments";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || "minioadmin",
});

export const ensureBucketExists = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`[MinIO] Bucket "${BUCKET_NAME}" created successfully.`);
    } else {
      console.log(`[MinIO] Bucket "${BUCKET_NAME}" is ready.`);
    }

    // Set public read policy for direct thumbnail preview / downloads
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient
      .setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
      .catch((err) => {
        console.log(`[MinIO] Info on bucket policy setup: ${err.message}`);
      });
  } catch (err) {
    console.error("[MinIO] Initialization error:", err);
  }
};

export default minioClient;
