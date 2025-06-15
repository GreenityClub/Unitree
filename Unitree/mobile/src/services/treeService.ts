import api from '../config/api';

export interface Tree {
  _id: string;
  userId: string;
  species: string;
  name?: string;
  plantedDate: Date;
  stage: 'sapling' | 'young' | 'mature';
  healthScore: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  lastWatered: Date;
}

export interface RedeemTreeData {
  speciesId: string;
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

  // Utility methods for tree management
  getTreeIcon(species: string, stage: string): string {
    switch (stage) {
      case 'sapling':
        return '🌱';
      case 'young':
        return '🌿';
      case 'mature':
        return '🌳';
      default:
        return '🌱';
    }
  }

  getStageColor(stage: string): string {
    switch (stage) {
      case 'sapling':
        return '#8BC34A';
      case 'young':
        return '#4CAF50';
      case 'mature':
        return '#2E7D32';
      default:
        return '#8BC34A';
    }
  }

  getHealthColor(health: number): string {
    if (health >= 80) return '#4CAF50';
    if (health >= 60) return '#FF9800';
    return '#f44336';
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
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}

export const treeService = new TreeService(); 