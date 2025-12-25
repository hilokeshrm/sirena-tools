
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'rx' | 'tx' | 'info' | 'error';
  message: string;
}

export interface ServoConfig {
  numServos: number;
  servoIds: number[];
  baudRate: number;
}

export interface SerialStatus {
  connected: boolean;
  portName?: string;
  error?: string;
}
