import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { MediaPipeHandTracker, HandRegion } from '../lib/mediapipe-hands';
import { apiService, PredictionResponse } from '../lib/api';

const PracticeEnhancedPage: React.FC = () => {
  const [currentWord, setCurrentWord] = useState('HELLO');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [predictedLetter, setPredictedLetter] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<MediaPipeHandTracker | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLetter = currentWord[currentLetterIndex];

  // Sample words for practice
  const practiceWords = ['HELLO', 'WORLD', 'ASL', 'LEARN', 'SIGN', 'LANGUAGE'];

  // MediaPipe results handler
  const onMediaPipeResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas and draw video frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw hand landmarks if detected
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);
      
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { 
          color: '#00FF00', 
          lineWidth: 2 
        });
        // Draw landmarks
        drawLandmarks(ctx, landmarks, { 
          color: '#FF0000', 
          lineWidth: 1,
          radius: 3
        });
      }

      // Extract hand region for AI prediction
      if (trackerRef.current && backendStatus === 'online') {
        const handRegion = trackerRef.current.extractHandRegion(results);
        if (handRegion && !isLoading) {
          predictLetter(handRegion);
        }
      }
    } else {
      setIsHandDetected(false);
    }
    
    ctx.restore();
  }, [isLoading, backendStatus]);

  // Initialize MediaPipe tracking
  useEffect(() => {
    const initializeTracking = async () => {
      if (videoRef.current && canvasRef.current && !trackerRef.current) {
        try {
          // Check backend status first
          const healthStatus = await apiService.checkHealth();
          setBackendStatus(healthStatus ? 'online' : 'offline');

          // Initialize MediaPipe
          trackerRef.current = new MediaPipeHandTracker(
            videoRef.current,
            canvasRef.current,
            onMediaPipeResults
          );
          
          await trackerRef.current.initialize();
          console.log('✅ MediaPipe hand tracking ready!');
          
        } catch (error) {
          console.error('❌ Failed to initialize MediaPipe:', error);
        }
      }
    };

    initializeTracking();

    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
    };
  }, [onMediaPipeResults]);

  // Predict letter using AI service
  const predictLetter = async (handRegion: HandRegion) => {
    if (isLoading || backendStatus !== 'online') return;
    
    setIsLoading(true);
    try {
      const response: PredictionResponse = await apiService.predictASL(handRegion.handImage);
      
      setPredictedLetter(response.prediction);
      setConfidence(response.confidence);
      
      const correct = response.prediction === currentLetter;
      setIsCorrect(correct);
      
      if (correct && response.confidence > 0.7) { // High confidence threshold
        setScore(prev => prev + 1);
        // Move to next letter after a short delay
        setTimeout(() => {
          if (currentLetterIndex < currentWord.length - 1) {
            setCurrentLetterIndex(prev => prev + 1);
            setIsCorrect(null);
            setPredictedLetter(null);
            setConfidence(0);
          } else {
            // Word completed
            setCurrentWord(practiceWords[Math.floor(Math.random() * practiceWords.length)]);
            setCurrentLetterIndex(0);
            setIsCorrect(null);
            setPredictedLetter(null);
            setConfidence(0);
          }
        }, 2000);
      }
      
      setTotalAttempts(prev => prev + 1);
    } catch (error) {
      console.error('Prediction error:', error);
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackColor = () => {
    if (isCorrect === null) return '#4f8cff';
    return isCorrect ? '#10B981' : '#EF4444';
  };

  const getFeedbackText = () => {
    if (!isHandDetected) return 'Show your hand to start';
    if (backendStatus === 'offline') return 'Backend offline - check connection';
    if (isCorrect === null) return 'Show the sign for:';
    return isCorrect ? 'Correct! 🎉' : `Try again! Expected: ${currentLetter}`;
  };

  const getStatusColor = () => {
    if (backendStatus === 'offline') return '#EF4444';
    if (!isHandDetected) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = () => {
    if (backendStatus === 'checking') return '🔍 Checking connection...';
    if (backendStatus === 'offline') return '❌ Backend offline';
    if (!isHandDetected) return '✋ Show your hand';
    return '✅ Hand detected';
  };

  return (
    <>
      <Head>
        <title>Enhanced ASL Practice - SpellWithASL</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f6fa 100%)',
        fontFamily: 'Poppins, sans-serif',
        padding: '2rem 1rem',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto 2rem',
        }}>
          <Link href="/">
            <button style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              borderRadius: 8,
              background: '#fff',
              color: '#4f8cff',
              border: '2px solid #4f8cff',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              ← Back to Home
            </button>
          </Link>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, color: '#1f2937' }}>
              Enhanced ASL Practice 🤟
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
              Score: {score}/{totalAttempts} ({totalAttempts > 0 ? Math.round((score/totalAttempts)*100) : 0}%)
            </p>
            {/* Status indicator */}
            <div style={{ 
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: 12,
              background: getStatusColor(),
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginTop: '0.5rem'
            }}>
              {getStatusText()}
            </div>
          </div>
          <div style={{ width: 120 }}></div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          maxWidth: 1200,
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {/* Enhanced Webcam Section with MediaPipe */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: '0 4px 24px rgba(79, 140, 255, 0.08)',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
              MediaPipe Hand Tracking 🔥
            </h2>
            
            {/* Hidden video element for MediaPipe */}
            <video 
              ref={videoRef}
              style={{ display: 'none' }}
              playsInline
            />
            
            {/* Canvas for MediaPipe visualization */}
            <div style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              border: `3px solid ${isHandDetected ? '#10B981' : '#e5e7eb'}`,
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // Mirror the camera
                }}
              />
              
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.2rem',
                }}>
                  🧠 AI Analyzing...
                </div>
              )}
            </div>
            
            {/* ASL Reference */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', color: '#4f8cff', fontWeight: 500, marginBottom: 8 }}>
                How to sign "{currentLetter}" in ASL:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
                <img
                  src={`/asl/${currentLetter}.jpg`}
                  alt={`ASL sign for letter ${currentLetter}`}
                  width={80}
                  height={80}
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    console.log(`Failed to load image for letter: ${currentLetter}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Practice Section */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '2rem',
            boxShadow: '0 4px 24px rgba(79, 140, 255, 0.08)',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1f2937' }}>
              Current Word
            </h2>
            
            {/* Word Display */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 600, color: '#1f2937', letterSpacing: '0.5rem' }}>
                {currentWord.split('').map((letter, index) => (
                  <span
                    key={index}
                    style={{
                      color: index === currentLetterIndex ? '#4f8cff' : '#9ca3af',
                      textDecoration: index === currentLetterIndex ? 'underline' : 'none',
                      textUnderlineOffset: '0.5rem',
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Letter */}
            <div style={{
              background: getFeedbackColor(),
              borderRadius: 12,
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#fff',
            }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                {getFeedbackText()}
              </h3>
              <div style={{ fontSize: '4rem', fontWeight: 600 }}>
                {currentLetter}
              </div>
            </div>

            {/* Enhanced Prediction Display */}
            {predictedLetter && (
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: '1.5rem',
                textAlign: 'center',
                border: `2px solid ${getFeedbackColor()}`,
              }}>
                <p style={{ margin: '0 0 0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                  AI Detected:
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                  {predictedLetter}
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: confidence > 0.7 ? '#10B981' : '#F59E0B',
                  fontWeight: 500
                }}>
                  Confidence: {Math.round(confidence * 100)}%
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