export interface PredictionResponse {
  prediction: string;
  confidence: number;
  processing_time?: number;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: handImage }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Prediction failed:', error);
      return {
        prediction: '?',
        confidence: 0.0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
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
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

// Export singleton instance
export const apiService = new ASLAPIService(); 