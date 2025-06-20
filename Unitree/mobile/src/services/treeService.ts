import api from '../config/api';

export interface TreeMilestone {
  date: Date;
  type: 'PLANTED' | 'STAGE_CHANGE' | 'PERFECT_HEALTH' | 'WATERED' | 'DIED';
  description: string;
  stageFrom?: string;
  stageTo?: string;
}

export interface Tree {
  _id: string;
  userId: string;
  species: string;
  name?: string;
  plantedDate: Date;
  stage: 'seedling' | 'sprout' | 'sapling' | 'young_tree' | 'mature_tree' | 'ancient_tree';
  healthScore: number;
  isDead: boolean;
  deathDate?: Date;
  totalWifiTime: number;
  wifiTimeAtRedeem: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastWatered: Date;
  milestones?: TreeMilestone[];
  growthProgress?: GrowthProgress;
  healthStatus?: HealthStatus;
}

export interface GrowthProgress {
  currentStage: string;
  nextStage: string | null;
  isMaxStage: boolean;
  totalWifiHours: number;
  progressInCurrentStage: number;
  timeNeededForNextStage: number;
  progressPercent: number;
  hoursToNextStage: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'critical' | 'dead';
  healthScore: number;
  daysSinceWatered: number | null;
  daysUntilDeath: number;
  canWater: boolean;
  lastWatered?: Date;
  deathDate?: Date;
}

export interface TreeSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  careLevel: string;
  maxHeight: string;
  lifespan: string;
  nativeTo: string;
  cost: number;
  stages: string[];
}

export interface RedeemTreeData {
  speciesId: string;
}

export interface WaterTreeResponse {
  success: boolean;
  message: string;
  tree?: Tree;
}

class TreeService {
  async getTrees(): Promise<Tree[]> {
    try {
      const response = await api.get('/api/trees');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get trees');
    }
  }

  async getTree(id: string): Promise<Tree> {
    try {
      const response = await api.get(`/api/trees/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get tree');
    }
  }

  async getTreeStatus(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/trees/${id}/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get tree status');
    }
  }

  async waterTree(id: string): Promise<WaterTreeResponse> {
    try {
      const response = await api.post(`/api/trees/${id}/water`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to water tree');
    }
  }

  async redeemTree(data: RedeemTreeData): Promise<Tree> {
    try {
      const response = await api.post('/api/trees/redeem', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to redeem tree');
    }
  }

  async getTreeTypes(): Promise<string[]> {
    try {
      const response = await api.get('/api/trees/types');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get tree types');
    }
  }

  async getTreeSpecies(): Promise<TreeSpecies[]> {
    try {
      const response = await api.get('/api/trees/species');
      return response.data;
    } catch (error: any) {
      console.error('Mobile: API call failed:', error);
      console.error('Mobile: Error response:', error.response);
      console.error('Mobile: Error message:', error.response?.data?.message);
      throw new Error(error.response?.data?.message || 'Failed to get tree species');
    }
  }

  async getTreeSpeciesById(id: string): Promise<TreeSpecies> {
    try {
      const response = await api.get(`/api/trees/species/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get tree species');
    }
  }

  // Utility methods for tree management
  getTreeIcon(species: string, stage: string): string {
    switch (stage) {
      case 'seedling':
        return '🌱';
      case 'sprout':
        return '🌿';
      case 'sapling':
        return '🪴';
      case 'young_tree':
        return '🌲';
      case 'mature_tree':
        return '🌳';
      case 'ancient_tree':
        return '🌲';
      default:
        return '🌱';
    }
  }

  getStageColor(stage: string): string {
    switch (stage) {
      case 'seedling':
        return '#8BC34A';
      case 'sprout':
        return '#7CB342';
      case 'sapling':
        return '#689F38';
      case 'young_tree':
        return '#558B2F';
      case 'mature_tree':
        return '#4CAF50';
      case 'ancient_tree':
        return '#2E7D32';
      default:
        return '#8BC34A';
    }
  }

  getHealthColor(health: number): string {
    if (health >= 80) return '#4CAF50';
    if (health >= 60) return '#FF9800';
    if (health >= 40) return '#FF5722';
    return '#f44336';
  }

  getHealthStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'unhealthy':
        return '#FF9800';
      case 'critical':
        return '#FF5722';
      case 'dead':
        return '#9E9E9E';
      default:
        return '#4CAF50';
    }
  }

  formatPlantedDate(dateString: Date): string {
    return new Date(dateString).toLocaleDateString();
  }

  getDaysGrowing(plantedDate: Date): number {
    const now = new Date();
    const planted = new Date(plantedDate);
    const diffTime = Math.abs(now.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getTreeCost(): number {
    return 100; // Points required to redeem a tree
  }

  canRedeemTree(userPoints: number): boolean {
    return userPoints >= this.getTreeCost();
  }

  getTreeDisplayName(tree: Tree): string {
    if (tree.name) return tree.name;
    return `${tree.species.charAt(0).toUpperCase() + tree.species.slice(1)} Tree`;
  }

  getTreeStatusText(stage: string): string {
    const stageNames = {
      'seedling': 'Seedling',
      'sprout': 'Sprout',
      'sapling': 'Sapling',
      'young_tree': 'Young Tree',
      'mature_tree': 'Mature Tree',
      'ancient_tree': 'Ancient Tree'
    };
    return stageNames[stage as keyof typeof stageNames] || 'Unknown';
  }

  // Get tree stage image path
  getTreeStageImage(stage: string): string {
    const stageImageMap = {
      'seedling': 'stage01',
      'sprout': 'stage02', 
      'sapling': 'stage03',
      'young_tree': 'stage04',
      'mature_tree': 'stage05',
      'ancient_tree': 'stage06'
    };
    const imageFile = stageImageMap[stage as keyof typeof stageImageMap] || 'stage01';
    return `../assets/trees/${imageFile}.png`;
  }

  // Format wifi time to hours and minutes
  formatWifiTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  // Format days since watered
  formatDaysSinceWatered(days: number): string {
    if (days < 1) {
      const hours = Math.floor(days * 24);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const roundedDays = Math.floor(days);
      return `${roundedDays} day${roundedDays !== 1 ? 's' : ''} ago`;
    }
  }

  // Calculate growth progress percentage for stage
  getStageProgressPercent(tree: Tree): number {
    if (!tree.growthProgress) return 0;
    return Math.min(100, tree.growthProgress.progressPercent);
  }

  // Get health warning message
  getHealthWarningMessage(healthStatus: HealthStatus): string | null {
    if (healthStatus.status === 'dead') {
      return 'Your tree has died from lack of watering';
    } else if (healthStatus.status === 'critical') {
      return `Your tree will die in ${healthStatus.daysUntilDeath.toFixed(1)} day${healthStatus.daysUntilDeath !== 1 ? 's' : ''} without water!`;
    } else if (healthStatus.status === 'unhealthy') {
      return 'Your tree needs water soon to stay healthy';
    }
    return null;
  }

  // Check if tree can be watered
  canWaterTree(tree: Tree): boolean {
    return tree.healthStatus?.canWater === true && !tree.isDead;
  }

  // Get next stage requirement text
  getNextStageRequirement(tree: Tree): string {
    if (!tree.growthProgress) return '';
    
    if (tree.growthProgress.isMaxStage) {
      return 'Maximum growth reached!';
    }
    
    return `${tree.growthProgress.hoursToNextStage} more hour${tree.growthProgress.hoursToNextStage !== 1 ? 's' : ''} of WiFi needed`;
  }

  // Real-time status checking
  async refreshTreeStatus(treeId: string): Promise<any> {
    try {
      return await this.getTreeStatus(treeId);
    } catch (error) {
      console.error('Failed to refresh tree status:', error);
      throw error;
    }
  }
}

export const treeService = new TreeService(); 