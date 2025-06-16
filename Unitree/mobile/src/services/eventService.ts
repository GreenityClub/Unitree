import { NativeEventEmitter, NativeModule, NativeModules } from 'react-native';

// Create a dummy native module to satisfy NativeEventEmitter requirements
const dummyModule: NativeModule = {
  addListener: () => {},
  removeListeners: () => {},
};

class EventService {
  private static instance: EventService;
  private emitter: NativeEventEmitter;

  private constructor() {
    // Initialize with a dummy native module
    this.emitter = new NativeEventEmitter(dummyModule);
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  public emit(event: string, data: any): void {
    this.emitter.emit(event, data);
  }

  public addListener(event: string, listener: (data: any) => void) {
    return this.emitter.addListener(event, listener);
  }

  public removeAllListeners(event: string): void {
    this.emitter.removeAllListeners(event);
  }
}

export const eventService = EventService.getInstance(); 