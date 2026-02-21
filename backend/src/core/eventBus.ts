import { EventEmitter } from 'events';

type ProtocolEvents =
  | 'habit:toggled'
  | 'habit:completed_day'
  | 'social:ping_sent'
  | 'scheduler:hourly_tick'
  | 'scheduler:daily_snapshot';

class ProtocolEventBus extends EventEmitter {
  emitEvent(event: ProtocolEvents, payload: unknown) {
    this.emit(event, payload);
  }

  onEvent(event: ProtocolEvents, listener: (payload: any) => void) {
    this.on(event, listener);
  }
}

export const eventBus = new ProtocolEventBus();
