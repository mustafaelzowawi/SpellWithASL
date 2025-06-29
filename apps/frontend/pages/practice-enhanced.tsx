import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Hands, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { apiService } from '../lib/api';

const PracticeEnhancedPage: React.FC = () => {
  // Game state
  const [currentWord] = useState('HELLO');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(0);
  const [predictionRate, setPredictionRate] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
   
  // Refs for MediaPipe (minimal approach that works)
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const isInitialized = useRef(false);
  const lastPredictionTime = useRef<number>(0);
  const predictionCount = useRef<number>(0);
  const rateUpdateTime = useRef<number>(0);

  const currentLetter = currentWord[currentLetterIndex];

  // Make prediction - completely isolated from MediaPipe (same as Debug V2)
  const makePrediction = async (landmarks: any[]) => {
    const now = Date.now();
    
    // Track prediction rate
    predictionCount.current += 1;
    if (now - rateUpdateTime.current > 1000) {
      setPredictionRate(predictionCount.current);
      predictionCount.current = 0;
      rateUpdateTime.current = now;
    }
    
    // Throttle predictions to max 5 per second for real-time feel
    if (now - lastPredictionTime.current < 200) {
      return;
    }
    
    lastPredictionTime.current = now;
    
    try {
      const landmarkData = landmarks.map(lm => [lm.x, lm.y, lm.z]);
      
      const result = await apiService.predictFromLandmarks(landmarkData);
      
      // Update state in next tick to avoid interfering with MediaPipe
      setTimeout(() => {
        if (result.error) {
          setLastError(result.error);
        } else {
          setLastError(null);
          setPrediction(result.prediction);
          setConfidence(result.confidence);
          
          const correct = result.prediction === currentLetter;
          setIsCorrect(correct);
          
          // Handle correct prediction
          if (correct && result.confidence > 0.6) {
            setScore(prev => prev + 1);
            
            // Move to next letter after delay
            setTimeout(() => {
              if (currentLetterIndex < currentWord.length - 1) {
                setCurrentLetterIndex(prev => prev + 1);
                // Reset prediction state for next letter
                setPrediction(null);
                setConfidence(0);
                setIsCorrect(null);
              } else {
                // Word complete!
                alert('Word completed! 🎉');
                setCurrentLetterIndex(0);
                setPrediction(null);
                setConfidence(0);
                setIsCorrect(null);
              }
            }, 1500);
          }
        }
      }, 0);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setTimeout(() => {
        setLastError(errorMsg);
      }, 0);
    }
  };

  // Initialize MediaPipe (same working approach as Debug V2)
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initializeMediaPipe = async () => {
      if (isInitialized.current || !videoRef.current || !canvasRef.current) {
        return;
      }
      
      console.log('🚀 Starting MediaPipe for practice...');
      
      try {
        // Create MediaPipe Hands (same as minimal test)
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
          selfieMode: true
        });
        
        // Results handler - draw AND make predictions
        hands.onResults((results: Results) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;

          // Clear and draw video
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          // Draw hand landmarks if detected
          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
            
            // Update hand detected state
            setIsHandDetected(true);
            
            // Make prediction (completely async, non-blocking)
            makePrediction(landmarks);
          } else {
            setIsHandDetected(false);
          }
        });
        
        handsRef.current = hands;
        
        // Get camera (same as minimal test)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Wait for video
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => resolve();
        });
        
        // Set canvas size
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        
        // Simple processing loop (same as minimal test)
        const processFrame = () => {
          if (handsRef.current && videoRef.current && isInitialized.current) {
            handsRef.current.send({ image: videoRef.current }).catch(console.error);
          }
          
          if (isInitialized.current) {
            // Process at ~15 FPS
            setTimeout(processFrame, 66);
          }
        };
        
        isInitialized.current = true;
        setIsReady(true);
        console.log('✅ MediaPipe initialized successfully for practice!');
        
        // Start processing
        processFrame();
        
      } catch (error) {
        console.error('❌ MediaPipe initialization failed:', error);
        setLastError('Failed to initialize camera');
      }
    };
    
    initializeMediaPipe();
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up practice page...');
      isInitialized.current = false;
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      handsRef.current = null;
    };
  }, [currentLetter]); // Include currentLetter in deps so predictions work with letter changes

  // Get status info
  const getStatus = () => {
    if (!isReady) return { text: '🚀 Starting camera...', color: '#ffc107' };
    if (!isHandDetected) return { text: '✋ Show your hand', color: '#6c757d' };
    if (prediction === currentLetter) return { text: '✅ Correct!', color: '#28a745' };
    return { text: '🤖 Ready', color: '#007bff' };
  };

  const status = getStatus();

  return (
    <>
      <Head>
        <title>ASL Practice - SpellWithASL</title>
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Header */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/">
            <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              ← Home
            </button>
          </Link>
          <h1 style={{ margin: 0, color: '#333' }}>ASL Practice 🤟</h1>
          <div style={{ color: '#666' }}>Score: {score}</div>
        </div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '20px',
          alignItems: 'start'
        }}>
          {/* Camera Section */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>Camera</h2>
              <div style={{ 
                padding: '5px 15px', 
                borderRadius: '20px', 
                background: status.color, 
                color: 'white',
                fontSize: '14px'
              }}>
                {status.text}
              </div>
            </div>
            
            <div style={{ 
              border: `2px solid ${isHandDetected ? '#28a745' : '#ddd'}`, 
              borderRadius: '10px', 
              overflow: 'hidden',
              background: '#000'
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
            </div>
          </div>

          {/* Practice Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Current Word */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Spell: {currentWord}</h3>
              <div style={{ fontSize: '2rem', letterSpacing: '0.5rem', marginBottom: '15px' }}>
                {currentWord.split('').map((letter, index) => (
                  <span key={index} style={{
                    color: index === currentLetterIndex ? '#007bff' : 
                           index < currentLetterIndex ? '#28a745' : '#ccc',
                    fontWeight: index === currentLetterIndex ? 'bold' : 'normal'
                  }}>
                    {letter}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '1.2rem', color: '#666' }}>
                Show: <strong style={{ color: '#007bff' }}>{currentLetter}</strong>
              </div>
            </div>

            {/* ASL Reference */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>ASL Reference</h3>
              <img 
                src={`/asl/${currentLetter}.jpg`}
                alt={`ASL ${currentLetter}`}
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  border: '2px solid #ddd'
                }}
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>

            {/* Prediction Result */}
            {prediction && (
              <div style={{ 
                background: isCorrect ? '#d4edda' : '#f8d7da', 
                color: isCorrect ? '#155724' : '#721c24',
                borderRadius: '10px', 
                padding: '15px', 
                textAlign: 'center',
                border: `2px solid ${isCorrect ? '#28a745' : '#dc3545'}`
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {prediction} ({Math.round(confidence * 100)}%)
                </div>
                <div>
                  {isCorrect ? '🎉 Correct!' : `❌ Try again (Expected: ${currentLetter})`}
                </div>
              </div>
            )}

                         {/* Real-time Stats */}
             {isHandDetected && (
               <div style={{ 
                 background: '#e7f3ff', 
                 color: '#004085',
                 borderRadius: '10px', 
                 padding: '10px', 
                 textAlign: 'center',
                 fontSize: '14px',
                 border: '1px solid #bee5eb'
               }}>
                 <strong>⚡ Real-time:</strong> {predictionRate} predictions/sec
               </div>
             )}

             {/* Top 3 Predictions for Debugging */}
             {prediction && confidence > 0 && (
               <div style={{ 
                 background: '#f8f9fa', 
                 color: '#495057',
                 borderRadius: '10px', 
                 padding: '15px', 
                 fontSize: '14px',
                 border: '1px solid #dee2e6',
                 marginTop: '10px'
               }}>
                 <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 Model Predictions:</div>
                 <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                   {/* This will be populated when we get top_predictions from API */}
                   <div style={{ 
                     background: isCorrect ? '#d4edda' : '#f8d7da',
                     color: isCorrect ? '#155724' : '#721c24',
                     padding: '5px 10px',
                     borderRadius: '5px',
                     fontSize: '12px',
                     fontWeight: 'bold'
                   }}>
                     #{1}: {prediction} ({(confidence * 100).toFixed(1)}%)
                   </div>
                 </div>
                 <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                   Target: <strong>{currentLetter}</strong> | 
                   Status: <strong style={{ color: isCorrect ? '#28a745' : '#dc3545' }}>
                     {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                   </strong>
                 </div>
               </div>
             )}

            {/* Error Display */}
            {lastError && (
              <div style={{ 
                background: '#f8d7da', 
                color: '#721c24',
                borderRadius: '10px', 
                padding: '10px', 
                textAlign: 'center',
                fontSize: '14px',
                border: '1px solid #f5c6cb'
              }}>
                <strong>❌ Error:</strong> {lastError}
                <button 
                  onClick={() => setLastError(null)}
                  style={{ 
                    marginLeft: '10px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#721c24',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeEnhancedPage; 