const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

// Function to create a CSV write stream
const createCsvWriteStream = (outputDir, fileName) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, fileName);
  const writeStream = fs.createWriteStream(filePath);
  const csvWriteStream = csv.format({ headers: true });
  csvWriteStream.pipe(writeStream);
  return csvWriteStream;
};

module.exports = { createCsvWriteStream };
