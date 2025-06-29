import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Hands, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { apiService } from '../lib/api';

const PracticeEnhancedPage: React.FC = () => {
  const router = useRouter();
  
  const getWordFromQuery = (): string => {
    const { word } = router.query;
    if (typeof word === 'string' && word.length > 0) {
      return word.toUpperCase();
    }
    return 'HELLO';
  };

  // Practice word pool for auto-progression
  const practiceWords = [
    'HELLO', 'WORLD', 'LOVE', 'PEACE', 'THANK', 'PLEASE', 'HELP', 'YES', 'NO', 'FAMILY',
    'FRIEND', 'HAPPY', 'GOOD', 'BAD', 'NICE', 'COOL', 'WORK', 'PLAY', 'TIME', 'HOME',
    'SCHOOL', 'LEARN', 'TEACH', 'READ', 'WRITE', 'BOOK', 'WATER', 'FOOD', 'WALK', 'RUN'
  ];

  // Game state
  const [currentWord, setCurrentWord] = useState<string>('HELLO');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [score, setScore] = useState(0);
  const [predictionRate, setPredictionRate] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [statusTick, setStatusTick] = useState(0); // For real-time status updates
  const [retryTrigger, setRetryTrigger] = useState(0); // For manual camera restart
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
   
  // Refs for MediaPipe (minimal approach that works)
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const isInitialized = useRef(false);
  const lastPredictionTime = useRef<number>(0);
  const predictionCount = useRef<number>(0);
  const rateUpdateTime = useRef<number>(0);
  const letterStartTime = useRef<number>(Date.now());
  const lastLetterCompletionTime = useRef<number>(0);
  const currentLetterRef = useRef<string>('');
  const currentLetterIndexRef = useRef<number>(0);
  const currentWordRef = useRef<string>('HELLO');

  const currentLetter = currentWord[currentLetterIndex];
  
  // Function to get next practice word
  const getNextWord = () => {
    // If we have a specific word from URL, stick with practice words after completion
    // Otherwise, cycle through the practice words or pick a random one
    const currentWordIndex = practiceWords.indexOf(currentWord);
    if (currentWordIndex !== -1 && currentWordIndex < practiceWords.length - 1) {
      // Move to next word in sequence
      return practiceWords[currentWordIndex + 1];
    } else {
      // Pick a random word from the pool (excluding current word)
      const availableWords = practiceWords.filter(word => word !== currentWord);
      return availableWords[Math.floor(Math.random() * availableWords.length)];
    }
  };

  // Update refs whenever state changes
  useEffect(() => {
    currentLetterRef.current = currentLetter;
    currentLetterIndexRef.current = currentLetterIndex;
    currentWordRef.current = currentWord;
  }, [currentLetter, currentLetterIndex, currentWord]);

  // Update word when router query changes
  useEffect(() => {
    if (router.isReady) {
      const wordFromQuery = getWordFromQuery();
      if (wordFromQuery !== currentWord) {
        setCurrentWord(wordFromQuery);
        setCurrentLetterIndex(0); // Reset to first letter
        setPrediction(null);
        setConfidence(0);
        setIsCorrect(null);
        setScore(0);
        setIsTransitioning(false);
        letterStartTime.current = Date.now();
        lastLetterCompletionTime.current = 0;
      }
    }
  }, [router.isReady, router.query.word]);

  // Timer for real-time status updates (countdown display)
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusTick(tick => tick + 1);
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, []);

  // Manual camera restart function
  const restartCamera = () => {
    console.log('🔄 Manual camera restart requested');
    setIsReady(false);
    setLastError(null);
    setRetryTrigger(prev => prev + 1); // This will trigger MediaPipe useEffect
  };

  // Make prediction - with improved timing and transition logic
  const makePrediction = async (landmarks: any[]) => {
    const now = Date.now();
    
    // Skip predictions during letter transitions
    if (isTransitioning) {
      return;
    }
    
    // Require minimum time on each letter (2 seconds) to prevent instant completions
    const timeOnCurrentLetter = now - letterStartTime.current;
    const minLetterTime = 2000; // 2 seconds minimum per letter
    
    // Require cooling-off period after last completion (1 second)
    const timeSinceLastCompletion = now - lastLetterCompletionTime.current;
    const coolingOffPeriod = 1000; // 1 second cooling off
    
    if (timeOnCurrentLetter < minLetterTime) {
      // Still in minimum time period - show predictions but don't allow completion
      if (now - lastPredictionTime.current >= 200) {
        lastPredictionTime.current = now;
        
        try {
          const landmarkData = landmarks.map(lm => [lm.x, lm.y, lm.z]);
          const result = await apiService.predictFromLandmarks(landmarkData);
          
          setTimeout(() => {
            if (result.error) {
              setLastError(result.error);
            } else {
              setLastError(null);
              setPrediction(result.prediction);
              setConfidence(result.confidence);
              setIsCorrect(result.prediction === currentLetterRef.current);
            }
          }, 0);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          setTimeout(() => setLastError(errorMsg), 0);
        }
      }
      return;
    }
    
    // Skip if still in cooling-off period
    if (lastLetterCompletionTime.current > 0 && timeSinceLastCompletion < coolingOffPeriod) {
      return;
    }
    
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
          
          const correct = result.prediction === currentLetterRef.current;
          setIsCorrect(correct);
          
          // Handle correct prediction - now with proper timing controls
          if (correct && result.confidence > 0.7) { // Increased confidence threshold
            console.log(`✅ Letter "${currentLetterRef.current}" completed after ${timeOnCurrentLetter}ms`);
            
            setScore(prev => prev + 1);
            setIsTransitioning(true); // Mark as transitioning
            lastLetterCompletionTime.current = now;
            
            // Move to next letter after delay
            setTimeout(() => {
              if (currentLetterIndexRef.current < currentWordRef.current.length - 1) {
                setCurrentLetterIndex(prev => prev + 1);
                // Reset prediction state for next letter
                setPrediction(null);
                setConfidence(0);
                setIsCorrect(null);
                setIsTransitioning(false);
                letterStartTime.current = Date.now(); // Reset timer for new letter
                console.log(`🔄 Moving to next letter: "${currentWordRef.current[currentLetterIndexRef.current + 1]}"`);
              } else {
                // Word complete! Auto-progress to next word
                setIsTransitioning(false);
                setWordsCompleted(prev => prev + 1);
                
                console.log(`🎉 Word "${currentWordRef.current}" completed! Moving to next word...`);
                
                // Show celebration overlay
                setShowCelebration(true);
                
                // Auto-progress to next word after brief celebration
                setTimeout(() => {
                  const nextWord = getNextWord();
                  setCurrentWord(nextWord);
                  setCurrentLetterIndex(0);
                  setPrediction(null);
                  setConfidence(0);
                  setIsCorrect(null);
                  letterStartTime.current = Date.now();
                  lastLetterCompletionTime.current = 0;
                  setShowCelebration(false);
                  
                  console.log(`🔄 Started new word: "${nextWord}"`);
                }, 2000); // 2 second celebration
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

  // Initialize MediaPipe with better error handling and retry logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    let initTimeout: NodeJS.Timeout;
    
    const initializeMediaPipe = async () => {
      // Reset initialization flag for retries
      isInitialized.current = false;
      
      if (!videoRef.current || !canvasRef.current) {
        return;
      }
      
      console.log(`🚀 Starting MediaPipe for practice... (attempt ${retryCount + 1}/${maxRetries})`);
      
      try {
        // Stop any existing streams first
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }

        // Create MediaPipe Hands with error handling
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
        
        // Results handler with better error checking
        hands.onResults((results: Results) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx || !results.image) return;

          try {
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
          } catch (drawError) {
            console.warn('⚠️ Drawing error (non-fatal):', drawError);
          }
        });
        
        handsRef.current = hands;
        
        // Get camera with better constraints and error handling
        console.log('📹 Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 }
          }
        });
        
        console.log('✅ Camera access granted');
        
        // Set video source and wait for it to load properly
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready with timeout
        await Promise.race([
          new Promise<void>((resolve) => {
            const video = videoRef.current!;
            
            const onLoadedMetadata = () => {
              console.log('📺 Video metadata loaded');
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            };
            
            const onCanPlay = () => {
              console.log('▶️ Video can play');
              video.removeEventListener('canplay', onCanPlay);
              resolve();
            };
            
            video.addEventListener('loadedmetadata', onLoadedMetadata);
            video.addEventListener('canplay', onCanPlay);
            
            // Start playing
            video.play().catch(console.error);
          }),
          new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error('Video load timeout')), 10000);
          })
        ]);
        
        // Set canvas size to match video
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth || 640;
        canvasRef.current.height = video.videoHeight || 480;
        
        console.log(`🖼️ Canvas size set to ${canvasRef.current.width}x${canvasRef.current.height}`);
        
        // Simple processing loop with error handling
        const processFrame = () => {
          if (handsRef.current && videoRef.current && isInitialized.current) {
            // Check if video is actually playing
            if (videoRef.current.readyState >= 2) {
              handsRef.current.send({ image: videoRef.current }).catch((err) => {
                console.warn('⚠️ MediaPipe processing error:', err);
              });
            }
          }
          
          if (isInitialized.current) {
            // Process at ~15 FPS
            setTimeout(processFrame, 66);
          }
        };
        
        isInitialized.current = true;
        setIsReady(true);
        setLastError(null); // Clear any previous errors
        console.log('✅ MediaPipe initialized successfully for practice!');
        
        // Start processing with small delay
        setTimeout(processFrame, 100);
        
      } catch (error) {
        console.error(`❌ MediaPipe initialization failed (attempt ${retryCount + 1}):`, error);
        
        // Clean up failed attempt
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
          setLastError(`Camera initialization failed. Retrying... (${retryCount}/${maxRetries})`);
          
          initTimeout = setTimeout(() => {
            initializeMediaPipe();
          }, 2000);
        } else {
          setLastError('Failed to initialize camera after multiple attempts. Please refresh the page.');
          console.error('💥 All initialization attempts failed');
        }
      }
    };
    
    // Add small delay before initialization to ensure DOM is ready
    initTimeout = setTimeout(initializeMediaPipe, 500);
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up practice page...');
      isInitialized.current = false;
      
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      handsRef.current = null;
    };
  }, [retryTrigger]); // Include retryTrigger for manual restarts

  // Get status info with timing feedback
  const getStatus = () => {
    if (!isReady) return { text: '🚀 Starting camera...', color: '#ffc107' };
    if (!isHandDetected) return { text: '✋ Show your hand', color: '#6c757d' };
    if (isTransitioning) return { text: '🔄 Moving to next letter...', color: '#6c757d' };
    
    const now = Date.now();
    const timeOnCurrentLetter = now - letterStartTime.current;
    const minLetterTime = 2000;
    const remainingTime = Math.max(0, minLetterTime - timeOnCurrentLetter);
    
    if (remainingTime > 0) {
      const seconds = Math.ceil(remainingTime / 1000);
      if (prediction === currentLetter) {
        return { text: `⏳ Hold for ${seconds}s more...`, color: '#ffc107' };
      } else {
        return { text: `⏱️ Min ${seconds}s per letter`, color: '#6c757d' };
      }
    }
    
    if (prediction === currentLetter) return { text: '✅ Correct!', color: '#28a745' };
    return { text: '🤖 Ready', color: '#007bff' };
  };

  const status = getStatus();

  return (
    <>
      <Head>
        <title>Practice ASL - SpellWithASL</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        padding: '20px', 
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/">
              <button style={{ 
                padding: '10px 16px', 
                background: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}>
                ← Home
              </button>
            </Link>
            <Link href="/word-selection">
              <button style={{ 
                padding: '10px 16px', 
                background: '#3b82f6', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6';
              }}>
                Change Word
              </button>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 600 }}>ASL Practice</h1>
            <div style={{ 
              background: '#f1f5f9', 
              color: '#475569', 
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #e2e8f0'
            }}>
              Letters: {score} | Words: {wordsCompleted}
            </div>
          </div>
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
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>Camera</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '16px', 
                  background: status.color, 
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {status.text}
                </div>
                <button
                  onClick={restartCamera}
                  style={{
                    padding: '6px 12px',
                    background: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#64748b';
                  }}
                  title="Restart camera if black screen appears"
                >
                  🔄
                </button>
              </div>
            </div>
            
            <div style={{ 
              border: `2px solid ${isHandDetected ? '#10b981' : '#e2e8f0'}`, 
              borderRadius: '12px', 
              overflow: 'hidden',
              background: '#000000'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Word */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>Spell: {currentWord}</h3>
              <div style={{ fontSize: '2rem', letterSpacing: '0.5rem', marginBottom: '16px' }}>
                {currentWord.split('').map((letter, index) => (
                  <span key={index} style={{
                    color: index === currentLetterIndex ? '#3b82f6' : 
                           index < currentLetterIndex ? '#10b981' : '#cbd5e1',
                    fontWeight: index === currentLetterIndex ? 600 : 'normal'
                  }}>
                    {letter}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '12px' }}>
                Show: <strong style={{ color: '#3b82f6', fontSize: '18px' }}>{currentLetter}</strong>
              </div>
              
              {/* Time Progress Indicator */}
              {(() => {
                const now = Date.now();
                const timeOnCurrentLetter = now - letterStartTime.current;
                const minLetterTime = 2000;
                const progress = Math.min(100, (timeOnCurrentLetter / minLetterTime) * 100);
                const isReady = timeOnCurrentLetter >= minLetterTime && !isTransitioning;
                
                return (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: isReady ? '#10b981' : '#64748b',
                      marginBottom: '8px',
                      fontWeight: 500
                    }}>
                      {isReady ? '✅ Ready to complete!' : '⏱️ Building confidence...'}
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#f1f5f9', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: isReady ? '#10b981' : '#3b82f6',
                        transition: 'all 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ASL Reference */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>ASL Reference</h3>
              <img 
                src={`/asl/${currentLetter}.jpg`}
                alt={`ASL ${currentLetter}`}
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  objectFit: 'cover', 
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>

            {/* Prediction Result */}
            {prediction && (
              <div style={{ 
                background: isCorrect ? '#f0fdf4' : '#fef2f2', 
                color: isCorrect ? '#166534' : '#991b1b',
                borderRadius: '16px', 
                padding: '20px', 
                textAlign: 'center',
                border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`
              }}>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  {prediction} ({Math.round(confidence * 100)}%)
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {isCorrect ? '🎉 Correct!' : `❌ Try again (Expected: ${currentLetter})`}
                </div>
              </div>
            )}

                         {/* Real-time Stats */}
             {isHandDetected && (
               <div style={{ 
                 background: '#f0f9ff', 
                 color: '#0369a1',
                 borderRadius: '16px', 
                 padding: '16px', 
                 textAlign: 'center',
                 fontSize: '14px',
                 fontWeight: 500,
                 border: '1px solid #e0f2fe'
               }}>
                 <strong>⚡ Real-time:</strong> {predictionRate} predictions/sec
               </div>
             )}



            {/* Error Display */}
            {lastError && (
              <div style={{ 
                background: '#fef2f2', 
                color: '#991b1b',
                borderRadius: '16px', 
                padding: '20px', 
                textAlign: 'center',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ marginBottom: '16px', fontWeight: 500 }}>
                  <strong>❌ Error:</strong> {lastError}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={restartCamera}
                    style={{ 
                      background: '#3b82f6', 
                      color: '#ffffff',
                      border: 'none', 
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                    }}
                  >
                    🔄 Restart Camera
                  </button>
                  <button 
                    onClick={() => setLastError(null)}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid #991b1b', 
                      color: '#991b1b',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Word Completion Celebration Overlay */}
        {showCelebration && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '48px 40px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              animation: 'scaleIn 0.3s ease-out'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '36px'
              }}>
                🎉
              </div>
              
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                Word Complete!
              </h2>
              
              <p style={{
                fontSize: '18px',
                color: '#10b981',
                fontWeight: 600,
                marginBottom: '8px'
              }}>
                "{currentWord}" ✓
              </p>
              
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '20px'
              }}>
                Moving to next word...
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                fontSize: '14px',
                color: '#94a3b8'
              }}>
                <span>Letters: {score}</span>
                <span>•</span>
                <span>Words: {wordsCompleted}</span>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
};

export default PracticeEnhancedPage; 