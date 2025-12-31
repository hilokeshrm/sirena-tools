
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'rx' | 'tx' | 'info' | 'error';
  message: string;
}

export type ServoType = 
  | 'AX-12A' 
  | 'AX-18A' 
  | 'AX-12W'
  | 'MX-28' 
  | 'MX-64' 
  | 'MX-106';

export interface IndividualServoState {
  id: number; // Active ID (0-based, used in commands)
  servoId: number; // Physical Servo ID (1-based)
  servoType: ServoType;
  angle: number;
  velocity: number;
  active?: boolean; // Whether the servo is active and will run
  angleMode?: '300' | '360'; // For MX servos: 300° or 360° mode (defaults to 360 for MX, N/A for others)
}

export interface SkillFrame {
  id: string;
  servos: IndividualServoState[];
  duration: number; // Time in ms to transition to this state
  hold: number;     // Time in ms to wait at this state before next
}

export interface Skill {
  id: string;
  name: string;
  frames: SkillFrame[];
  createdAt: number;
  loop: boolean;
}

export interface ServoConfig {
  numServos: number;
  servoIds: number[]; // Physical Servo IDs (1-based)
  baudRate: number;
  servos: IndividualServoState[];
}

export interface SerialStatus {
  connected: boolean;
  portName?: string;
  error?: string;
}

export type ProductType = 'Nino' | 'Nino T' | 'Perro' | 'Twist' | 'Robotic Arm V1' | 'Robotic Arm V2' | 'Daisy Chain' | null;

export type CommandFormat = 'batch' | 'interleaved' | 'separate';

export const PRODUCT_PRESETS: Record<string, { count: number; ids: number[] }> = {
  'Nino': { count: 2, ids: [1, 2] },
  'Nino T': { count: 3, ids: [1, 2, 3] },
  'Perro': { count: 12, ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  'Twist': { count: 1, ids: [1] },
  'Robotic Arm V1': { count: 4, ids: [1, 2, 3, 4] },
  'Robotic Arm V2': { count: 6, ids: [1, 2, 3, 4, 5, 6] },
  'Daisy Chain': { count: 1, ids: [1] },
};

// Helper functions for servo angle ranges
export const isMXServo = (servoType: ServoType): boolean => {
  return servoType === 'MX-28' || servoType === 'MX-64' || servoType === 'MX-106';
};

export const getMaxAngle = (servoType: ServoType, angleMode?: '300' | '360'): number => {
  if (isMXServo(servoType)) {
    return angleMode === '300' ? 300 : 360;
  }
  return 300;
};

export const getCenterAngle = (servoType: ServoType, angleMode?: '300' | '360'): number => {
  if (isMXServo(servoType)) {
    return angleMode === '300' ? 150 : 180;
  }
  return 150;
};

// Convert angle in degrees to position value (0-4095 for MX servos)
export const angleToPosition = (angle: number, servoType: ServoType, angleMode?: '300' | '360'): number => {
  if (isMXServo(servoType)) {
    const maxDegrees = angleMode === '300' ? 300 : 360;
    const clampedAngle = Math.max(0, Math.min(maxDegrees, angle));
    return Math.floor((clampedAngle / maxDegrees) * 4095);
  }
  // For non-MX servos: 0-300° maps to 0-1023
  const clampedAngle = Math.max(0, Math.min(300, angle));
  return Math.floor((clampedAngle / 300) * 1023);
};
