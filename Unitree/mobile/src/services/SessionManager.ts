import AsyncStorage from '@react-native-async-storage/async-storage';
import { wifiService } from './wifiService';

interface SessionState {
  isActive: boolean;
  sessionId: string | null;
  startTime: Date | null;
  lastUpdate: Date;
  ipAddress: string | null;
  pendingOperations: Set<string>;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionState: SessionState = {
    isActive: false,
    sessionId: null,
    startTime: null,
    lastUpdate: new Date(),
    ipAddress: null,
    pendingOperations: new Set()
  };
  
  private lockTimeout = 5000; // 5 second timeout for operations
  private listeners: Set<(state: SessionState) => void> = new Set();

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private constructor() {
    this.loadSessionState();
  }

  private async loadSessionState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem('session_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.sessionState = {
          ...parsed,
          startTime: parsed.startTime ? new Date(parsed.startTime) : null,
          lastUpdate: new Date(parsed.lastUpdate),
          pendingOperations: new Set() // Never restore pending operations
        };
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
  }

  private async saveSessionState(): Promise<void> {
    try {
      await AsyncStorage.setItem('session_state', JSON.stringify({
        ...this.sessionState,
        pendingOperations: undefined // Don't save pending operations
      }));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.sessionState });
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  addListener(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async withLock<T>(operationId: string, operation: () => Promise<T>): Promise<T> {
    // Prevent concurrent operations of the same type
    if (this.sessionState.pendingOperations.has(operationId)) {
      throw new Error(`Operation ${operationId} already in progress`);
    }

    this.sessionState.pendingOperations.add(operationId);

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation ${operationId} timed out`)), this.lockTimeout)
        )
      ]);
      return result;
    } finally {
      this.sessionState.pendingOperations.delete(operationId);
    }
  }

  async startSession(ipAddress: string): Promise<boolean> {
    return this.withLock('start_session', async () => {
      // Check if session is already active
      if (this.sessionState.isActive && this.sessionState.ipAddress === ipAddress) {
        console.log('Session already active for this IP, skipping start');
        return true;
      }

      // End any existing session first
      if (this.sessionState.isActive) {
        console.log('Ending existing session before starting new one');
        await this.endSessionInternal();
      }

      try {
        const response = await wifiService.startSession({ ipAddress });
        
        this.sessionState = {
          ...this.sessionState,
          isActive: true,
          sessionId: response.sessionId || 'unknown',
          startTime: new Date(),
          lastUpdate: new Date(),
          ipAddress
        };

        await this.saveSessionState();
        console.log('Session started successfully:', this.sessionState.sessionId);
        return true;
      } catch (error) {
        console.error('Failed to start session:', error);
        // Reset state on failure
        this.sessionState.isActive = false;
        this.sessionState.sessionId = null;
        this.sessionState.startTime = null;
        await this.saveSessionState();
        return false;
      }
    });
  }

  async endSession(): Promise<boolean> {
    return this.withLock('end_session', () => this.endSessionInternal());
  }

  private async endSessionInternal(): Promise<boolean> {
    if (!this.sessionState.isActive) {
      console.log('No active session to end');
      return true;
    }

    try {
      await wifiService.endSession();
      
      this.sessionState = {
        ...this.sessionState,
        isActive: false,
        sessionId: null,
        startTime: null,
        lastUpdate: new Date(),
        ipAddress: null
      };

      await this.saveSessionState();
      console.log('Session ended successfully');
      return true;
    } catch (error) {
      console.error('Failed to end session:', error);
      // Force reset state even if API call failed
      this.sessionState.isActive = false;
      this.sessionState.sessionId = null;
      this.sessionState.startTime = null;
      await this.saveSessionState();
      return false;
    }
  }

  async updateSession(): Promise<boolean> {
    if (!this.sessionState.isActive) {
      return false;
    }

    return this.withLock('update_session', async () => {
      try {
        await wifiService.updateSession();
        this.sessionState.lastUpdate = new Date();
        await this.saveSessionState();
        return true;
      } catch (error: any) {
        // If server says no active session, sync our local state
        if (error.response?.status === 404 || error.message?.includes('No active session found')) {
          console.log('📡 Server has no active session, syncing local state in SessionManager');
          this.sessionState.isActive = false;
          this.sessionState.sessionId = null;
          this.sessionState.startTime = null;
          this.sessionState.ipAddress = null;
          await this.saveSessionState();
          return false;
        }
        console.error('Failed to update session:', error);
        return false;
      }
    });
  }

  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  isSessionActive(): boolean {
    return this.sessionState.isActive;
  }

  getCurrentSessionDuration(): number {
    if (!this.sessionState.startTime || !this.sessionState.isActive) {
      return 0;
    }
    return Math.floor((Date.now() - this.sessionState.startTime.getTime()) / 1000);
  }

  async forceResetSession(): Promise<void> {
    console.log('Force resetting session state');
    this.sessionState = {
      isActive: false,
      sessionId: null,
      startTime: null,
      lastUpdate: new Date(),
      ipAddress: null,
      pendingOperations: new Set()
    };
    await this.saveSessionState();
  }

  // Cleanup method for when user logs out
  async cleanup(): Promise<void> {
    try {
      if (this.sessionState.isActive) {
        await this.endSessionInternal();
      }
      await AsyncStorage.removeItem('session_state');
      this.listeners.clear();
    } catch (error) {
      console.error('Failed to cleanup session manager:', error);
    }
  }
}

export default SessionManager; 