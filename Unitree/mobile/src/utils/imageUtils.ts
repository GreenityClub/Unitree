import ENV from '../config/env';

export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Construct full URL using the API base URL
  return `${ENV.API_URL}/${avatarPath}`;
};

// Utility to handle avatar loading errors gracefully
export const handleAvatarError = (onError?: () => void) => {
  return () => {
    console.log('Avatar failed to load, falling back to initials');
    if (onError) onError();
  };
}; 