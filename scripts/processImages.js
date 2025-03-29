const { fetchBatch, updateDatabase } = require('../services/databaseService');
const { downloadImage } = require('../services/downloadService');
const { uploadToS3 } = require('../services/s3Service');
const { createCsvWriteStream } = require('../services/csvService');
const { sanitizePath } = require('../utils/pathUtils');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config(); 

// Directories
const outputDir = './csv';
const uploadDir = './upload';

// Queries
const queryImagePath = `
  SELECT id, image_path
  FROM image_master
  WHERE image_path IS NOT NULL
  LIMIT ?, ?;
`;

const querySource = `
  SELECT id, source
  FROM image_master
  WHERE source LIKE '%s3.amazonaws%'
  AND source IS NOT NULL
  LIMIT ?, ?;
`;

const batchSize = parseInt(process.env.BATCH_SIZE, 10);

// Ensure directories exist before writing files
const ensureDirectoryExistence = (dirPath) => {
  const dir = path.dirname(dirPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Function to extract the bucket name from a full S3 URL or image_path
const extractBucketName = (path) => {
  const match = path.match(/^https:\/\/([^.]+)\.s3\.amazonaws\.com/); // For full S3 URLs
  if (match) return match[1]; // Extract bucket name from URL

  // If not a full URL, treat path as a potential relative S3 path
  const parts = path.split('/');
  return parts.length > 1 ? parts[0] : ''; // Return bucket name from relative path
};

// Function to construct the full URL for image paths
const constructFullPath = (path) => {
  if (path.startsWith('https://')) {
    return path; // If it's already a full URL, return it as-is
  }

  const bucketName = extractBucketName(path);
  const sanitizedPath = path.replace(`${bucketName}/`, ''); // Remove the bucket prefix
  return `https://${bucketName}.s3.amazonaws.com/${sanitizedPath}`;
};

// Check if URL exists (to skip 404s)
const checkIfUrlExists = async (url) => {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Function to process image_path records
const processImagePathBatch = async (offset, batchNumber) => {
  const rows = await fetchBatch(offset, batchSize, queryImagePath);
  if (!rows.length) {
    console.log('No more image_path records to process.');
    return false;
  }

  const csvWriteStream = createCsvWriteStream(outputDir, `export_images_batch_image_path_${batchNumber}.csv`);
  csvWriteStream.write({
    id: 'id',
    image_path_original: 'image_path_original',
    image_path_bucket: 'image_path_bucket',
    sanitized_path_image: 'sanitized_path_image',
  });

  for (const row of rows) {
    const imagePath = row.image_path || '';
    const imagePathBucket = imagePath ? extractBucketName(imagePath) : '';
    const sanitizedPathImage = imagePath ? sanitizePath(imagePath).replace(/^public\//, '') : '';
    const imageUrl = imagePath ? constructFullPath(imagePath) : '';
    const localPathImage = path.join(uploadDir, sanitizedPathImage);

    if (!imagePathBucket) {
      console.log(`Skipping record with missing bucket name: id=${row.id}`);
      const csvRow = {
        id: String(row.id),
        image_path_original: imagePath,
        image_path_bucket: imagePathBucket,
        sanitized_path_image: sanitizedPathImage,
      };
      csvWriteStream.write(csvRow);
      continue;
    }

    console.log(`Processing image_path record: id=${row.id}`);

    try {
      if (imageUrl && await checkIfUrlExists(imageUrl)) {
        ensureDirectoryExistence(localPathImage);
        await downloadImage(imageUrl, localPathImage);
        await uploadToS3(localPathImage, sanitizedPathImage);
        // await updateDatabase(row.id, 'image_path', sanitizedPathImage);
      } else {
        console.log(`Skipping invalid or non-existent URL: ${imageUrl}`);
      }

      const csvRow = {
        id: String(row.id),
        image_path_original: imagePath,
        image_path_bucket: imagePathBucket,
        sanitized_path_image: sanitizedPathImage,
      };
      csvWriteStream.write(csvRow);
    } catch (error) {
      console.error(`Error processing image_path record ${row.id}: ${error.message}`);
    }
  }

  csvWriteStream.end();
  console.log(`Batch ${batchNumber} for image_path processed and CSV exported.`);

  return true;
};

// Function to process source records
const processSourceBatch = async (offset, batchNumber) => {
  const rows = await fetchBatch(offset, batchSize, querySource);
  if (!rows.length) {
    console.log('No more source records to process.');
    return false;
  }

  const csvWriteStream = createCsvWriteStream(outputDir, `export_images_batch_source_${batchNumber}.csv`);
  csvWriteStream.write({
    id: 'id',
    source_original: 'source_original',
    source_bucket: 'source_bucket',
    sanitized_path_source: 'sanitized_path_source',
  });

  for (const row of rows) {
    const sourcePath = row.source || '';
    const sourcePathBucket = sourcePath ? extractBucketName(sourcePath) : '';
    const sanitizedPathSource = sourcePath ? sanitizePath(sourcePath).replace(/^public\//, '') : '';
    const sourceUrl = sourcePath ? constructFullPath(sourcePath) : '';
    const localPathSource = path.join(uploadDir, sanitizedPathSource);

    if (!sourcePathBucket) {
      console.log(`Skipping record with missing bucket name: id=${row.id}`);
      const csvRow = {
        id: String(row.id),
        source_original: sourcePath,
        source_bucket: sourcePathBucket,
        sanitized_path_source: sanitizedPathSource,
      };
      csvWriteStream.write(csvRow);
      continue;
    }

    console.log(`Processing source record: id=${row.id}`);

    try {
      if (sourceUrl && await checkIfUrlExists(sourceUrl)) {
        ensureDirectoryExistence(localPathSource);
        await downloadImage(sourceUrl, localPathSource);
        await uploadToS3(localPathSource, sanitizedPathSource);
        // await updateDatabase(row.id, 'source', sanitizedPathSource);
      } else {
        console.log(`Skipping invalid or non-existent URL: ${sourceUrl}`);
      }

      const csvRow = {
        id: String(row.id),
        source_original: sourcePath,
        source_bucket: sourcePathBucket,
        sanitized_path_source: sanitizedPathSource,
      };
      csvWriteStream.write(csvRow);
    } catch (error) {
      console.error(`Error processing source record ${row.id}: ${error.message}`);
    }
  }

  csvWriteStream.end();
  console.log(`Batch ${batchNumber} for source processed and CSV exported.`);

  return true;
};

// Function to export data to CSV and process images for both image_path and source
const exportToCSVAndProcessImages = async () => {
  let offset = 0;
  let hasMoreImagePath = true;
  let hasMoreSource = true;
  let batchNumberImagePath = 1;
  let batchNumberSource = 1;

  // Process image_path batches
  while (hasMoreImagePath) {
    console.log(`Processing batch for image_path ${batchNumberImagePath} starting at offset ${offset}`);
    hasMoreImagePath = await processImagePathBatch(offset, batchNumberImagePath);
    offset += batchSize;
    batchNumberImagePath += 1;
  }

  offset = 0;  // Reset offset for the next batch

  // Process source batches
  while (hasMoreSource) {
    console.log(`Processing batch for source ${batchNumberSource} starting at offset ${offset}`);
    hasMoreSource = await processSourceBatch(offset, batchNumberSource);
    offset += batchSize;
    batchNumberSource += 1;
  }

  console.log('All batches for image_path and source processed and CSVs exported.');
};

module.exports = { exportToCSVAndProcessImages };
