import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandRegion {
  handImage: string; // base64 encoded cropped hand region
  landmarks: number[][]; // 21 hand landmarks
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class MediaPipeHandTracker {
  private hands: Hands;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private onResults: (results: Results) => void;
  private isInitialized = false;

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults: (results: Results) => void
  ) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onResults = onResults;

    // Initialize MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: this.videoElement });
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isInitialized = true;
      console.log('MediaPipe hand tracking initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  // Extract hand region for AI classification
  extractHandRegion(results: Results): HandRegion | null {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.multiHandLandmarks[0];
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw current frame to canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    // Calculate bounding box from landmarks
    const xs = landmarks.map(l => l.x * canvas.width);
    const ys = landmarks.map(l => l.y * canvas.height);

    const padding = 60; // Extra padding for better crop
    const minX = Math.max(0, Math.min(...xs) - padding);
    const maxX = Math.min(canvas.width, Math.max(...xs) + padding);
    const minY = Math.max(0, Math.min(...ys) - padding);
    const maxY = Math.min(canvas.height, Math.max(...ys) + padding);

    const width = maxX - minX;
    const height = maxY - minY;

    // Create a new canvas for the hand region
    const handCanvas = document.createElement('canvas');
    const targetSize = 224; // Standard input size for AI models
    handCanvas.width = targetSize;
    handCanvas.height = targetSize;
    const handCtx = handCanvas.getContext('2d');
    
    if (!handCtx) return null;

    // Draw the hand region, resized to target size
    handCtx.drawImage(
      canvas,
      minX, minY, width, height,
      0, 0, targetSize, targetSize
    );

    ctx.restore();

    // Convert to base64 for API
    const handImage = handCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Convert landmarks to array format
    const landmarkArray = landmarks.map(lm => [lm.x, lm.y, lm.z]);

    return {
      handImage,
      landmarks: landmarkArray,
      boundingBox: {
        x: minX,
        y: minY,
        width,
        height
      }
    };
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
} 