// Shared types for SpellWithASL API contracts

export interface PredictionRequest {
  image: string; // base64 encoded image
}

export interface PredictionResponse {
  prediction: string; // "A", "B", "C", etc.
  confidence: number; // 0.0 to 1.0
  processing_time?: number; // Optional processing time in seconds
  hand_detected?: boolean; // Hand detection status
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  message: string;
  version?: string;
  ai_service_status?: 'connected' | 'disconnected';
}

export interface ASLLetter {
  letter: string;
  description: string;
  image_url?: string;
}

// Frontend-only MediaPipe types (not sent to backend)
export interface HandLandmarks {
  landmarks: number[][]; // 21 hand landmarks with [x, y, z] coordinates
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WordPractice {
  word: string;
  current_letter_index: number;
  completed_letters: boolean[];
  accuracy: number;
}

export interface UserSession {
  session_id: string;
  start_time: string;
  words_practiced: string[];
  total_accuracy: number;
}

// API endpoint types
export const API_ENDPOINTS = {
  PREDICT: '/predict',
  HEALTH: '/health',
  BATCH_PREDICT: '/predict/batch',
} as const;

// Port configuration
export const PORTS = {
  FRONTEND: 3000,
  BACKEND: 8000,
  AI_SERVICE: 8001,
} as const;

// ASL Alphabet letters
export const ASL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z'
] as const;

export type ASLLetterType = typeof ASL_LETTERS[number]; 