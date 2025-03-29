const mysql = require('mysql2/promise');
const fs = require('fs');
const csv = require('fast-csv');
const path = require('path');
const axios = require('axios'); // For HTTP requests

// Database configuration
const dbConfig = {
  host: 'localhost', // Change as needed
  user: 'root', // Change as needed
  password: 'welcome@123', // Change as needed
  database: 'OCT_V_6_0', // Change as needed
};

// Query to fetch image_path
const query = 'SELECT image_path FROM image_master WHERE image_path IS NOT NULL;';

// Directories
const outputDir = path.join(__dirname, 'csv');
const uploadDir = path.join(__dirname, 'upload');

// Function to extract the bucket name
const extractBucketName = (imagePath) => {
  return imagePath.split('/')[0] || '';
};

// Function to construct the full URL without duplicate bucket names
const constructFullPath = (bucketName, imagePath) => {
  const sanitizedPath = imagePath.replace(`${bucketName}/`, '');
  return `https://${bucketName}.s3.amazonaws.com/${sanitizedPath}`;
};

// Function to download and save an image
const downloadImage = async (url, outputPath) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    // Ensure directories exist for the output path
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write the file to the path
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
  }
};

const exportToCSVAndDownloadImages = async () => {
  try {
    // Ensure the required folders exist
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    console.log(`Directories ensured: ${outputDir}, ${uploadDir}`);

    // Connect to the database
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database.');

    // Fetch data
    const [rows] = await connection.query(query);
    console.log(`Fetched ${rows.length} records.`);

    // Close the connection
    await connection.end();

    if (rows.length === 0) {
      console.log('No records found.');
      return;
    }

    // Transform data to include bucket name, full URL, and download images
    const transformedRows = rows.map((row) => {
      const bucketName = extractBucketName(row.image_path);
      const fullUrl = constructFullPath(bucketName, row.image_path);
      const localPath = path.join(uploadDir, row.image_path.replace(`${bucketName}/`, '')); // Remove bucket prefix for local structure
      return { image_path: row.image_path, bucket_name: bucketName, full_url: fullUrl, local_path: localPath };
    });

    // Download images and write CSV in chunks of 500
    const chunkSize = 500;
    let chunkIndex = 0;

    for (let i = 0; i < transformedRows.length; i += chunkSize) {
      const chunk = transformedRows.slice(i, i + chunkSize);

      // Download images in the current chunk
      for (const record of chunk) {
        console.log(`Downloading: ${record.full_url} -> ${record.local_path}`);
        await downloadImage(record.full_url, record.local_path);
      }

      // Create CSV file path
      const fileName = path.join(outputDir, `export_chunk_${chunkIndex + 1}.csv`);
      const writeStream = fs.createWriteStream(fileName);

      csv
        .write(chunk.map(({ image_path, bucket_name, full_url }) => ({ image_path, bucket_name, full_url })), { headers: true })
        .pipe(writeStream)
        .on('finish', () => {
          console.log(`Exported ${fileName} with ${chunk.length} records.`);
        });

      chunkIndex++;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

exportToCSVAndDownloadImages();
