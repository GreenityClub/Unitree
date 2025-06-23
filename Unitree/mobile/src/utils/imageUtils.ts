import ENV from '../config/env';

export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;
  
  // If it's already a full URL (Cloudinary or other cloud storage), return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // For local storage paths, construct full URL using the API base URL
  // Ensure we don't double-add slashes
  const baseUrl = ENV.API_URL.endsWith('/') ? ENV.API_URL.slice(0, -1) : ENV.API_URL;
  const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${baseUrl}${path}`;
};

// Utility to handle avatar loading errors gracefully
export const handleAvatarError = (onError?: () => void) => {
  return () => {
    console.log('Avatar failed to load, falling back to initials');
    if (onError) onError();
  };
};

// Check if an avatar URL is from cloud storage
export const isCloudAvatar = (avatarPath: string | null | undefined): boolean => {
  if (!avatarPath) return false;
  return avatarPath.includes('cloudinary.com') || avatarPath.includes('amazonaws.com') || avatarPath.startsWith('http');
}; 