# Image Upload Utility

This utility is designed to process image paths or source URLs, download images from those paths, upload them to an S3 bucket, and update records in a database. The utility also generates CSV files containing details about the image paths, which include the original image path, sanitized path, and S3 bucket information.

## Features

- **Process image paths**: Extracts image paths from the database, downloads images, uploads them to S3, and updates the database with the sanitized path.
- **Process source URLs**: Extracts source URLs from the database, downloads images, uploads them to S3, and updates the database with the sanitized source path.
- **Generate CSV files**: Creates CSV files with information about the processed image paths and sources.
- **Handle S3 uploads**: Uploads images to a specified AWS S3 bucket.

## Prerequisites

Before you begin, ensure you have the following installed and set up:

- [Node.js](https://nodejs.org/) (>= 14.x)
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) (included in this project)
- [AWS S3 Bucket](https://aws.amazon.com/s3/) for uploading images
- A `.env` file with the necessary AWS credentials and configurations.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-repo/image-upload-utility.git
    cd image-upload-utility
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your AWS credentials and bucket information:

    ```env
    DESTINATION_BUCKET_ACCESS_KEY=your-access-key
    DESTINATION_BUCKET_SECRET_KEY=your-secret-key
    DESTINATION_BUCKET_REGION=your-region
    DESTINATION_BUCKET=your-bucket-name
    BATCH_SIZE=100  # Adjust based on the size of your batches
    ```

## Usage

1. **Process image paths and sources**:

    To start processing, run the following command:

    ```bash
    node processImages.js
    ```

    This will:
    - Download images from URLs in the database
    - Upload images to the specified S3 bucket
    - Generate CSV files (`export_images_batch_image_path_*` and `export_images_batch_source_*`) in the `csv` directory
    - Update the database with sanitized paths

2. **Process image paths**: The utility processes the `image_path` field from the database and uploads those images to S3.

3. **Process source URLs**: The utility also processes the `source` field from the database and uploads images from there as well.

## Functionality Overview

### sanitizePath

This function sanitizes image paths and URLs. It handles paths from both local systems and S3 URLs, removing the bucket name and unnecessary prefixes.

### uploadToS3

Uploads an image (or any file) to an S3 bucket. It reads the local file, then uploads it to the specified S3 bucket under a given key.

### processImagePathBatch

Processes a batch of image paths from the database, downloads images, uploads them to S3, and generates a CSV file with metadata.

### processSourceBatch

Processes a batch of source URLs from the database, downloads images, uploads them to S3, and generates a CSV file with metadata.

## Configuration

- `DESTINATION_BUCKET`: The name of the S3 bucket where images will be uploaded.
- `DESTINATION_BUCKET_ACCESS_KEY`: AWS access key for authentication.
- `DESTINATION_BUCKET_SECRET_KEY`: AWS secret key for authentication.
- `DESTINATION_BUCKET_REGION`: AWS region for the S3 bucket.
- `BATCH_SIZE`: Defines the number of records to process per batch.

## Error Handling

If the utility encounters any errors (e.g., failed image download or upload to S3), it logs the error and continues processing the next record. This ensures that the utility does not halt on a single failure.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-xyz`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-xyz`).
5. Create a new Pull Request.

## Contact

For any questions or issues, feel free to open an issue on the repository or contact the repository maintainer.

