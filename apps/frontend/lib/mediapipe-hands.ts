import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandRegion {
  handImage: string; // base64 encoded cropped hand region
  landmarks: number[][]; // 21 hand landmarks
}

export class MediaPipeHandTracker {
  private hands: Hands;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private onResults: (results: Results) => void;
  private isReady = false;

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults: (results: Results) => void
  ) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onResults = onResults;

    // Simple MediaPipe setup
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true
    });

    this.hands.onResults(this.onResults);
  }

  async initialize(): Promise<void> {
    if (this.isReady) return;

    // Get camera stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    });

    this.videoElement.srcObject = stream;
    this.videoElement.play();

    // Wait for video to load
    await new Promise<void>((resolve) => {
      this.videoElement.onloadedmetadata = () => resolve();
    });

    // Set canvas size
    this.canvasElement.width = 640;
    this.canvasElement.height = 480;

    // Start MediaPipe
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 640,
      height: 480
    });

    await this.camera.start();
    this.isReady = true;
  }

  // Simple hand region extraction
  extractHandRegion(results: Results): HandRegion | null {
    if (!results.multiHandLandmarks?.[0]) return null;

    const landmarks = results.multiHandLandmarks[0];
    const canvas = this.canvasElement;
    
    // Get hand bounding box
    const xs = landmarks.map(l => l.x * canvas.width);
    const ys = landmarks.map(l => l.y * canvas.height);
    
    const minX = Math.max(0, Math.min(...xs) - 40);
    const maxX = Math.min(canvas.width, Math.max(...xs) + 40);
    const minY = Math.max(0, Math.min(...ys) - 40);
    const maxY = Math.min(canvas.height, Math.max(...ys) + 40);

    // Create cropped image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 224;
    tempCanvas.height = 224;
    const ctx = tempCanvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 224, 224);
    
    ctx.drawImage(
      canvas,
      minX, minY, maxX - minX, maxY - minY,
      0, 0, 224, 224
    );

    return {
      handImage: tempCanvas.toDataURL('image/jpeg').split(',')[1],
      landmarks: landmarks.map(lm => [lm.x, lm.y, lm.z])
    };
  }

  stop(): void {
    this.camera?.stop();
    if (this.videoElement.srcObject) {
      (this.videoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    this.isReady = false;
  }

  get ready(): boolean {
    return this.isReady;
  }
} 