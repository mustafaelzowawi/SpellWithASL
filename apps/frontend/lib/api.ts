export interface PredictionResponse {
  prediction: string;
  confidence: number;
  processing_time?: number;
  error?: string;
}



export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface LandmarkPredictionRequest {
  landmarks: number[][]; // [[x,y,z], [x,y,z], ...] format expected by backend
}

export class ASLAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }



  async predictFromLandmarks(landmarks: number[][]): Promise<PredictionResponse> {
    try {
      // Validate landmarks count
      if (landmarks.length !== 21) {
        console.error(`Invalid landmarks count: ${landmarks.length}, expected 21`);
        return {
          prediction: '?',
          confidence: 0.0,
          error: `Invalid landmarks count: ${landmarks.length}`
        };
      }

      const response = await fetch(`${this.baseURL}/predict-landmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks }),
        // Reasonable timeout for real-time feel
        signal: AbortSignal.timeout(5000) // 5 seconds max
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Prediction result:', result); // Debug logging
      return result;
    } catch (error) {
      console.error('Landmark prediction failed:', error);
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


}

// Export singleton instance
export const apiService = new ASLAPIService(); 