/**
 * Utility Function: sanitizePath
 * --------------------------------
 * Purpose:
 * This function is designed to sanitize image paths or URLs, specifically to clean or adjust the image path 
 * by removing unnecessary parts like the bucket name. It is useful when working with S3 URLs or local file paths.
 * 
 * Behavior:
 * - Handles full S3 URLs (e.g., "https://bucket.s3.amazonaws.com/images/photo.jpg").
 * - Processes S3 URLs with the bucket name as a prefix (e.g., "bucket/images/photo.jpg").
 * - Leaves local file paths untouched (e.g., "images/photo.jpg").
 * 
 * Examples:
 * 1. Input: "https://my-bucket.s3.amazonaws.com/images/photo.jpg"
 *    Output: "images/photo.jpg"
 * 
 * 2. Input: "my-bucket/images/photo.jpg"
 *    Output: "images/photo.jpg"
 * 
 * 3. Input: "images/photo.jpg"
 *    Output: "images/photo.jpg"
 * 
 * Error Handling:
 * - If the input is not a valid URL, it treats the input as a local path and removes any leading bucket name or directory.
 * 
 * Parameters:
 * @param {string} pathOrUrl - The image path or URL to be sanitized.
 * 
 * Returns:
 * @returns {string} - The sanitized image path.
 */
const sanitizePath = (pathOrUrl) => {
  try {
   
    const parsedUrl = new URL(pathOrUrl);

    
    if (parsedUrl.hostname === 's3.amazonaws.com') {

      const match = parsedUrl.pathname.match(/^\/[^/]+\/(.+)/); 
      return match ? match[1] : parsedUrl.pathname.substring(1);
    } 

  
    else if (parsedUrl.hostname.endsWith('.s3.amazonaws.com')) {
      return parsedUrl.pathname.substring(1); 
    }

    // If not an S3 URL, return the input as is
    return pathOrUrl;

  } catch (error) {
    // For invalid URLs, treat as local paths and remove leading bucket name
    return pathOrUrl.replace(/^[^/]+\//, ''); // Remove bucket name or first directory
  }
};

module.exports = { sanitizePath };
