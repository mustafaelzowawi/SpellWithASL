import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { MediaPipeHandTracker } from '../lib/mediapipe-hands';
import { apiService } from '../lib/api';

const PracticeEnhancedPage: React.FC = () => {
  // Simplified state
  const [currentWord] = useState('HELLO');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<MediaPipeHandTracker | null>(null);
  const predictionTimer = useRef<NodeJS.Timeout | null>(null);

  const currentLetter = currentWord[currentLetterIndex];

  // Handle MediaPipe results
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Draw video and hand tracking
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.[0]) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand landmarks
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

      // Make prediction (throttled)
      if (predictionTimer.current) clearTimeout(predictionTimer.current);
      predictionTimer.current = setTimeout(() => makePrediction(results), 500);
    } else {
      setIsHandDetected(false);
    }
  }, []);

  // Make AI prediction
  const makePrediction = async (results: Results) => {
    if (!trackerRef.current) return;
    
    const handRegion = trackerRef.current.extractHandRegion(results);
    if (!handRegion) return;

    try {
      const response = await apiService.predictASL(handRegion.handImage);
      setPrediction(response.prediction);
      setConfidence(response.confidence);
      
      const correct = response.prediction === currentLetter;
      setIsCorrect(correct);
      
      if (correct && response.confidence > 0.6) {
        setScore(prev => prev + 1);
        // Move to next letter
        setTimeout(() => {
          if (currentLetterIndex < currentWord.length - 1) {
            setCurrentLetterIndex(prev => prev + 1);
            resetPrediction();
          } else {
            // Word complete!
            alert('Word completed! 🎉');
            setCurrentLetterIndex(0);
            resetPrediction();
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const resetPrediction = () => {
    setPrediction(null);
    setConfidence(0);
    setIsCorrect(null);
  };

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      if (!videoRef.current || !canvasRef.current || trackerRef.current) return;
      
      try {
        trackerRef.current = new MediaPipeHandTracker(
          videoRef.current,
          canvasRef.current,
          onResults
        );
        
        await trackerRef.current.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();
    return () => {
      trackerRef.current?.stop();
      if (predictionTimer.current) clearTimeout(predictionTimer.current);
    };
  }, [onResults]);

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
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeEnhancedPage; 