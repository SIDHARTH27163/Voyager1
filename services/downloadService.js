const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to download images
const downloadImage = async (url, outputPath) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
     console.error(`Failed to download ${url}: ${error.message}`);
  }
};

module.exports = { downloadImage };
