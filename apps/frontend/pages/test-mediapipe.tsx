import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_connections } from '@mediapipe/hands';
import { MediaPipeHandTracker } from '../lib/mediapipe-hands';

const TestMediaPipePage: React.FC = () => {
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<MediaPipeHandTracker | null>(null);

  // Handle MediaPipe results
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Check for hands and draw landmarks
    if (results.multiHandLandmarks?.[0]) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand tracking
      drawConnectors(ctx, landmarks, HAND_connections, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
      
      // Test hand region extraction
      if (trackerRef.current) {
        const handRegion = trackerRef.current.extractHandRegion(results);
        if (handRegion) {
          console.log('✅ Hand region extracted successfully');
        }
      }
    } else {
      setIsHandDetected(false);
    }
  }, []);

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !canvasRef.current || trackerRef.current) return;
      
      try {
        setError(null);
        trackerRef.current = new MediaPipeHandTracker(
          videoRef.current,
          canvasRef.current,
          onResults
        );
        
        await trackerRef.current.initialize();
        setIsReady(true);
        console.log('✅ MediaPipe test ready!');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize camera';
        setError(errorMsg);
        console.error('❌ MediaPipe test failed:', err);
      }
    };

    init();
    return () => trackerRef.current?.stop();
  }, [onResults]);

  return (
    <>
      <Head>
        <title>MediaPipe Test - SpellWithASL</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/">
            <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              ← Home
            </button>
          </Link>
          <h1 style={{ margin: 0 }}>MediaPipe Test 🧪</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
            <strong>Error:</strong> {error}
            <br />
            <small>Try refreshing the page and allowing camera access.</small>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Camera Feed */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Camera Feed</h2>
            
            <div style={{ 
              border: `3px solid ${isHandDetected ? '#28a745' : '#6c757d'}`, 
              borderRadius: '10px', 
              overflow: 'hidden',
              background: '#000',
              position: 'relative'
            }}>
              <video ref={videoRef} style={{ display: 'none' }} />
              <canvas 
                ref={canvasRef} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  transform: 'scaleX(-1)',
                  maxHeight: '400px'
                }} 
              />
              
              {/* Status Overlay */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: isHandDetected ? '#28a745' : (isReady ? '#6c757d' : '#ffc107'),
                color: 'white',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {!isReady ? '🚀 Starting...' : 
                 isHandDetected ? '✅ Hand Detected' : 
                 '👋 Show Your Hand'}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Test Results</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Camera Status */}
              <div>
                <strong>Camera:</strong>
                <div style={{ color: isReady ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                  {isReady ? '✅ Ready' : '❌ Not Ready'}
                </div>
              </div>

              {/* Hand Detection */}
              <div>
                <strong>Hand Detection:</strong>
                <div style={{ color: isHandDetected ? '#28a745' : '#6c757d', fontWeight: 'bold' }}>
                  {isHandDetected ? '✅ Detected' : '❌ Not Detected'}
                </div>
              </div>

              {/* Browser Features */}
              <div>
                <strong>Browser Support:</strong>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  📷 Camera: {navigator.mediaDevices ? '✅' : '❌'}
                  <br />
                  🌐 WebGL: {(() => {
                    try {
                      const canvas = document.createElement('canvas');
                      return canvas.getContext('webgl') ? '✅' : '❌';
                    } catch {
                      return '❌';
                    }
                  })()}
                </div>
              </div>

              {/* Instructions */}
              <div style={{ 
                background: '#e7f3ff', 
                color: '#004085',
                padding: '15px', 
                borderRadius: '5px',
                fontSize: '14px',
                border: '1px solid #bee5eb'
              }}>
                <strong>Test Instructions:</strong>
                <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                  <li>Allow camera access when prompted</li>
                  <li>Show your hand to the camera</li>
                  <li>Move your hand around</li>
                  <li>Check that landmarks appear on your hand</li>
                  <li>Look for success messages in the browser console</li>
                </ol>
              </div>

              {/* Quick Actions */}
              <div>
                <Link href="/practice-enhanced">
                  <button style={{
                    width: '100%',
                    padding: '12px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    Try Full Practice →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {isReady && isHandDetected && (
          <div style={{ 
            background: '#d4edda', 
            color: '#155724',
            padding: '15px', 
            borderRadius: '5px', 
            marginTop: '20px',
            border: '1px solid #c3e6cb',
            textAlign: 'center'
          }}>
            <strong>🎉 Great! MediaPipe is working correctly!</strong>
            <br />
            Your camera and hand tracking are both functional. You can now use the full ASL practice mode.
          </div>
        )}
      </div>
    </>
  );
};

export default TestMediaPipePage; 