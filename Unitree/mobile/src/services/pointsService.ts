import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const POINTS_STORAGE_KEY = '@unitree_points';
const TRANSACTIONS_STORAGE_KEY = '@unitree_transactions';
const TREE_COST = 100; // Points needed to redeem one tree

export interface Transaction {
  _id?: string;
  id?: string;
  type: string;
  amount: number;
  createdAt: string;
  timestamp?: string;
  metadata?: {
    startTime?: string;
    endTime?: string;
    duration?: number;
    source?: string;
  };
}

export interface PointsState {
  points: number;
  transactions: Transaction[];
}

export interface AttendancePointsData {
  duration: number;
  startTime: string | Date;
  endTime: string | Date;
}

export interface SyncAttendanceData {
  points: number;
  source: string;
}

export interface PointsResponse {
  points: number;
  totalPoints?: number;
  transactions?: Transaction[];
  transaction?: Transaction;
}

export interface RedeemTreeResponse {
  points: number;
  transaction?: Transaction;
  tree?: any;
  user?: any;
}

type PointsListener = (state: PointsState) => void;

class PointsService {
  private points: number = 0;
  private transactions: Transaction[] = [];
  private listeners: Set<PointsListener> = new Set();

  constructor() {
    this.points = 0;
    this.transactions = [];
    this.listeners = new Set();
  }

  async init(): Promise<void> {
    try {
      // Load cached data
      const pointsData = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
      if (pointsData) {
        const parsed = JSON.parse(pointsData) as PointsState;
        this.points = parsed.points;
        this.transactions = parsed.transactions;
      }

      // Fetch latest data from server
      const response = await api.get('/api/points');
      const serverData = response.data as PointsResponse;
      
      this.points = serverData.points;
      if (serverData.transactions) {
        this.transactions = serverData.transactions;
      }
      
      await this.saveState();
    } catch (error) {
      console.error('Failed to initialize points:', error);
    }
  }

  handlePointsUpdate = (data: PointsResponse): void => {
    if (data.points !== undefined) {
      this.points = data.points;
    }
    if (data.totalPoints !== undefined) {
      this.points = data.totalPoints;
    }
    if (data.transaction) {
      // Check if transaction already exists to avoid duplicates
      const existingTransaction = this.transactions.find(t => 
        t._id === data.transaction!._id || 
        t.id === data.transaction!.id ||
        (t.timestamp === data.transaction!.timestamp && t.amount === data.transaction!.amount)
      );
      if (!existingTransaction) {
        this.transactions.unshift(data.transaction);
      }
    }
    this.saveState();
  };

  addListener(callback: PointsListener): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(callback => callback(state));
  }

  getState(): PointsState {
    return {
      points: this.points,
      transactions: this.transactions,
    };
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        POINTS_STORAGE_KEY,
        JSON.stringify(this.getState())
      );
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save points state:', error);
    }
  }

  getPoints(): number {
    return this.points;
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  canRedeemTree(): boolean {
    return this.points >= TREE_COST;
  }

  async addPoints(amount: number, source: string): Promise<boolean> {
    try {
      const response = await api.post('/api/points/sync', {
        points: amount,
        source,
      });

      const data = response.data as PointsResponse;
      this.points = data.points;
      if (data.transaction) {
        this.transactions.unshift(data.transaction);
      }

      await this.saveState();
      return true;
    } catch (error) {
      console.error('Failed to add points:', error);
      return false;
    }
  }

  async redeemTree(speciesId?: string): Promise<RedeemTreeResponse> {
    if (!this.canRedeemTree()) {
      throw new Error('Not enough points');
    }

    try {
      const response = await api.post('/api/trees/redeem', speciesId ? { speciesId } : {});
      const data = response.data as RedeemTreeResponse;
      
      this.points = data.points;
      if (data.transaction) {
        this.transactions.unshift(data.transaction);
      }
      await this.saveState();
      return data;
    } catch (error) {
      console.error('Failed to redeem tree:', error);
      throw error;
    }
  }

  async addAttendancePoints(duration: number, startTime: string | Date, endTime: string | Date): Promise<boolean> {
    try {
      const response = await api.post('/api/points/attendance', {
        duration,
        startTime,
        endTime,
      });
      
      const data = response.data as PointsResponse;
      // response: { points, totalPoints, transactions }
      this.points = data.totalPoints || data.points;
      if (data.transactions && data.transactions.length > 0) {
        // Add new transactions to the front
        this.transactions = [
          ...data.transactions,
          ...this.transactions
        ];
      }
      await this.saveState();
      return true;
    } catch (error) {
      console.error('Failed to add attendance points:', error);
      return false;
    }
  }

  async refreshPoints(): Promise<void> {
    try {
      const response = await api.get('/api/points');
      const data = response.data as PointsResponse;
      
      this.points = data.points;
      if (data.transactions) {
        this.transactions = data.transactions;
      }
      
      await this.saveState();
    } catch (error) {
      console.error('Failed to refresh points:', error);
    }
  }

  static get TREE_COST(): number {
    return TREE_COST;
  }
}

export const pointsService = new PointsService();
export default pointsService; 