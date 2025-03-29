const fs = require('fs'); // For file system operations
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK to interact with S3
require('dotenv').config(); // Load environment variables from a .env file

// AWS S3 configuration using the AWS SDK
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.DESTINATION_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.DESTINATION_BUCKET_SECRET_KEY,
  },
  region: process.env.DESTINATION_BUCKET_REGION,
});

/**
 * Function to upload an image (or any file) to an S3 bucket and delete it locally.
 * 
 * @param {string} filePath - The local path to the file to be uploaded.
 * @param {string} key - The key (path in the S3 bucket) where the file will be stored.
 */
const uploadToS3 = async (filePath, key) => {
  try {
    // Read the file content synchronously from the local filesystem
    const fileContent = fs.readFileSync(filePath);

    // Construct the S3 object key
    const s3Key = `public/${key}`;

    // Define parameters for S3 upload
    const params = {
      Bucket: process.env.DESTINATION_BUCKET,
      Key: s3Key, 
      Body: fileContent, 
    };

    // Upload the file to S3
    await s3Client.send(new PutObjectCommand(params));
    console.log(`Uploaded to S3: ${s3Key}`);

    // Delete the file from the local filesystem
    fs.unlinkSync(filePath);
    console.log(`Deleted local file: ${filePath}`);
  } catch (error) {
  
    // console.error(`Failed to upload ${filePath} to S3: ${error.message}`);
  }
};

module.exports = { uploadToS3 };
