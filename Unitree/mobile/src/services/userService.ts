import api from '../config/api';

export interface ProfileUpdateData {
  nickname?: string;
  fullname?: string;
  university?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface LeaderboardUser {
  id: string;
  fullname: string;
  nickname?: string;
  points: number; // Current redeemable points
  allTimePoints?: number; // Total points earned from WiFi time
  totalWifiTimeSeconds?: number; // Total WiFi connection time in seconds
  totalWifiTimeFormatted?: string; // Human-readable WiFi time format
  avatar?: string;
  email: string;
  university?: string;
  treesPlanted?: number;
  rank: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  userRank?: number | null;
  totalUsers?: number;
  currentUserId?: string;
}

class UserService {
  async updateProfile(data: ProfileUpdateData) {
    try {
      const response = await api.put('/api/users/profile', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  async changePassword(data: PasswordChangeData) {
    try {
      const response = await api.put('/api/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  async uploadAvatar(imageUri: string) {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  async deleteAvatar() {
    try {
      const response = await api.delete('/api/users/avatar');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete avatar');
    }
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
    try {
      const response = await api.get(`/api/users/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get leaderboard');
    }
  }
}

const userService = new UserService();
export default userService; 