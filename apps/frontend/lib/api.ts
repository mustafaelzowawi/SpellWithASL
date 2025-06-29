export interface PredictionResponse {
  prediction: string;
  confidence: number;
  processing_time?: number;
  hand_detected?: boolean;
  error?: string;
}

export interface PredictionRequest {
  image: string; // base64 encoded image
}

export class ASLAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  async predictASL(handImage: string): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: handImage // base64 hand region from MediaPipe
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PredictionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('API prediction error:', error);
      
      // Return error response
      return {
        prediction: '?',
        confidence: 0.0,
        hand_detected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);
      
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Batch prediction for multiple images (future feature)
  async predictBatch(handImages: string[]): Promise<PredictionResponse[]> {
    try {
      const response = await fetch(`${this.baseURL}/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          images: handImages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PredictionResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('Batch prediction error:', error);
      return handImages.map(() => ({
        prediction: '?',
        confidence: 0.0,
        hand_detected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

// Singleton instance
export const apiService = new ASLAPIService(); 