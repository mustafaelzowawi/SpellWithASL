import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandLandmarks {
  landmarks: number[][]; // 21 hand landmarks [[x,y,z], ...]
}

// Global instance counter to prevent multiple MediaPipe instances
let instanceCount = 0;

export class MediaPipeHandTracker {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private onResults: (results: Results) => void;
  private isReady = false;
  private isProcessingFrame = false;
  private instanceId: number;
  private lastFrameTime = 0;
  private frameInterval = 100; // Process max 10 frames per second

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults: (results: Results) => void
  ) {
    this.instanceId = ++instanceCount;
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onResults = onResults;
    
    console.log(`MediaPipe instance ${this.instanceId} created`);
  }

  async initialize(): Promise<void> {
    if (this.isReady) return;
    
    try {
      console.log(`Initializing MediaPipe instance ${this.instanceId}...`);
      
      // Initialize MediaPipe Hands with error handling
      if (!this.hands) {
        console.log(`Creating MediaPipe Hands for instance ${this.instanceId}...`);
        this.hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        this.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Reduced complexity for stability
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
          selfieMode: true
        });

        this.hands.onResults(this.onResults);
        console.log(`MediaPipe Hands created for instance ${this.instanceId}`);
      }

      // Get camera stream
      console.log(`Getting camera stream for instance ${this.instanceId}...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      this.videoElement.srcObject = stream;
      this.videoElement.play();

      // Wait for video to load
      await new Promise<void>((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          console.log(`Video loaded for instance ${this.instanceId}`);
          resolve();
        };
      });

      // Set canvas size
      this.canvasElement.width = 640;
      this.canvasElement.height = 480;

      // Start MediaPipe with completely non-blocking frame processing
      console.log(`Starting camera for instance ${this.instanceId}...`);
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          const now = Date.now();
          
          // Skip frame if already processing, no hands initialized, or too soon since last frame
          if (this.isProcessingFrame || !this.hands || (now - this.lastFrameTime) < this.frameInterval) {
            return;
          }
          
          this.lastFrameTime = now;
          this.isProcessingFrame = true;
          
          // Process frame in next tick to avoid blocking
          setTimeout(() => {
            if (this.hands && this.isReady) {
              this.hands.send({ image: this.videoElement }).catch((error) => {
                console.error(`MediaPipe processing error (instance ${this.instanceId}):`, error);
              }).finally(() => {
                this.isProcessingFrame = false;
              });
            } else {
              this.isProcessingFrame = false;
            }
          }, 0);
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isReady = true;
      console.log(`MediaPipe instance ${this.instanceId} fully initialized!`);
      
    } catch (error) {
      console.error(`Failed to initialize MediaPipe instance ${this.instanceId}:`, error);
      this.cleanup();
      throw error;
    }
  }
  
  private cleanup(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    
    if (this.videoElement.srcObject) {
      (this.videoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    
    this.hands = null;
    this.isReady = false;
    this.isProcessingFrame = false;
    this.lastFrameTime = 0;
    console.log(`MediaPipe instance ${this.instanceId} cleaned up`);
  }

  // Extract hand landmarks only (no image processing)
  extractHandLandmarks(results: Results): HandLandmarks | null {
    if (!results.multiHandLandmarks?.[0] || !this.isReady) return null;

    const landmarks = results.multiHandLandmarks[0];
    
    try {
      return {
        landmarks: landmarks.map(lm => [lm.x, lm.y, lm.z])
      };
    } catch (error) {
      console.error(`Hand landmarks extraction error (instance ${this.instanceId}):`, error);
      return null;
    }
  }

  stop(): void {
    console.log(`Stopping MediaPipe instance ${this.instanceId}...`);
    this.cleanup();
  }

  get ready(): boolean {
    return this.isReady;
  }
} 