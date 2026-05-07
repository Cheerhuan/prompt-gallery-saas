/**
 * Google Drive Image URL Helper
 * Converts sharing links or File IDs into direct renderable URLs
 */

export function getGoogleDriveDirectLink(input: string): string {
  // 1. Handle full sharing URL: https://drive.google.com/file/d/[FILE_ID]/view...
  const urlRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//;
  const match = input.match(urlRegex);
  
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  // 2. Handle raw File ID (if it looks like a GDrive ID: 33+ chars, alphanumeric/underscore/hyphen)
  if (input.length >= 25 && /^[a-zA-Z0-9_-]+$/.test(input)) {
    return `https://lh3.googleusercontent.com/d/${input}`;
  }

  // 3. Fallback: return original input if it's already a direct link or external URL
  return input;
}
