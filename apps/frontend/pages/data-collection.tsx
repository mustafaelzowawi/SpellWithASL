import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { MediaPipeHandTracker } from '../lib/mediapipe-hands';

const DataCollectionPage: React.FC = () => {
  const [currentLetter, setCurrentLetter] = useState('A');
  const [isRecording, setIsRecording] = useState(false);
  const [samplesCollected, setSamplesCollected] = useState<Record<string, number>>({});
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastSampleTime, setLastSampleTime] = useState(0);
  const [sessionStats, setSessionStats] = useState({ total: 0, target: 10 });
  const [isCollecting, setIsCollecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<MediaPipeHandTracker | null>(null);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Store current values in refs to avoid stale closures
  const isRecordingRef = useRef(isRecording);
  const currentLetterRef = useRef(currentLetter);
  const lastSampleTimeRef = useRef(lastSampleTime);
  
  // Update refs when values change
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  useEffect(() => {
    currentLetterRef.current = currentLetter;
  }, [currentLetter]);
  
  useEffect(() => {
    lastSampleTimeRef.current = lastSampleTime;
  }, [lastSampleTime]);

  // Handle MediaPipe results and data collection
  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Draw video and landmarks
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.[0]) {
      setIsHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand tracking
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

      // Collect training data if recording (throttled)
      const now = Date.now();
      if (isRecordingRef.current && now - lastSampleTimeRef.current > 500) {
        collectSample(landmarks);
        lastSampleTimeRef.current = now;
        setLastSampleTime(now);
      }
    } else {
      setIsHandDetected(false);
    }
  }, []); // Remove dependencies to prevent MediaPipe reinitialization

  // Collect landmark sample (non-blocking)
  const collectSample = (landmarks: any[]) => {
    const landmarkData = landmarks.map(lm => [lm.x, lm.y, lm.z]);

    const letterToCollect = currentLetterRef.current;
    setIsCollecting(true);

    // Use non-blocking fetch (don't await)
    fetch('/api/collect-sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letter: letterToCollect,
        landmarks: landmarkData,
        timestamp: Date.now()
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setSamplesCollected(prev => ({
          ...prev,
          [letterToCollect]: (prev[letterToCollect] || 0) + 1
        }));
        setSessionStats(prev => ({ ...prev, total: prev.total + 1 }));
      }
    })
    .catch(error => {
      console.error('Failed to collect sample:', error);
    })
    .finally(() => {
      // Reset collecting indicator after a short delay
      setTimeout(() => setIsCollecting(false), 200);
    });
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
    };
  }, [onResults]);

  // Start/stop recording
  const toggleRecording = () => {
    if (!isHandDetected) {
      alert('Please show your hand before recording!');
      return;
    }
    setIsRecording(!isRecording);
  };

  // Navigation functions
  const nextLetter = () => {
    const currentIndex = letters.indexOf(currentLetter);
    const nextIndex = (currentIndex + 1) % letters.length;
    setCurrentLetter(letters[nextIndex]);
    setIsRecording(false);
  };

  const prevLetter = () => {
    const currentIndex = letters.indexOf(currentLetter);
    const prevIndex = currentIndex === 0 ? letters.length - 1 : currentIndex - 1;
    setCurrentLetter(letters[prevIndex]);
    setIsRecording(false);
  };

  const getCurrentStats = () => {
    const collected = samplesCollected[currentLetter] || 0;
    const target = sessionStats.target;
    return { collected, target, percentage: Math.round((collected / target) * 100) };
  };

  const stats = getCurrentStats();

  return (
    <>
      <Head>
        <title>ASL Data Collection - SpellWithASL</title>
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Header */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Link href="/">
            <button style={{ 
              padding: '10px 20px', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}>
              ← Home
            </button>
          </Link>
          <h1 style={{ margin: 0, color: '#1e40af' }}>ASL Data Collection 📊</h1>
          <div style={{ 
            padding: '10px 15px', 
            background: '#10b981', 
            color: 'white', 
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Total: {sessionStats.total}
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
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '15px' 
            }}>
              <h2 style={{ margin: 0 }}>Data Collection Camera</h2>
              <div style={{ 
                padding: '8px 15px', 
                borderRadius: '20px', 
                background: isHandDetected ? '#10b981' : (isReady ? '#6b7280' : '#f59e0b'), 
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {!isReady ? '🚀 Starting...' : 
                 isHandDetected ? '✅ Hand Ready' : 
                 '✋ Show Hand'}
              </div>
            </div>
            
            <div style={{ 
              border: `3px solid ${isRecording ? '#ef4444' : (isHandDetected ? '#10b981' : '#d1d5db')}`, 
              borderRadius: '12px', 
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
              
              {/* Recording indicator */}
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '15px',
                  background: isCollecting ? '#10b981' : '#ef4444',
                  color: 'white',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }}></div>
                  {isCollecting ? 'COLLECTING ✓' : 'RECORDING'}
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px', 
              marginTop: '15px' 
            }}>
              <button 
                onClick={toggleRecording}
                disabled={!isHandDetected}
                style={{ 
                  padding: '12px 30px', 
                  background: isRecording ? '#ef4444' : '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: isHandDetected ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: isHandDetected ? 1 : 0.5
                }}
              >
                {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
              </button>
            </div>
          </div>

          {/* Collection Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Current Letter */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Current Letter</h3>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                marginBottom: '15px'
              }}>
                {currentLetter}
              </div>
              
              {/* Progress for current letter */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  background: '#e5e7eb', 
                  borderRadius: '8px', 
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    background: '#10b981', 
                    height: '100%', 
                    width: `${Math.min(stats.percentage, 100)}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  marginTop: '5px' 
                }}>
                  {stats.collected}/{stats.target} samples ({stats.percentage}%)
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={prevLetter}
                  style={{ 
                    padding: '8px 15px', 
                    background: '#6b7280', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  ← Prev
                </button>
                <button 
                  onClick={nextLetter}
                  style={{ 
                    padding: '8px 15px', 
                    background: '#6b7280', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* ASL Reference */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>ASL Reference</h3>
              <img 
                src={`/asl/${currentLetter}.jpg`}
                alt={`ASL ${currentLetter}`}
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  border: '2px solid #d1d5db'
                }}
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>

            {/* Collection Stats */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>Session Progress</h3>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                fontSize: '14px'
              }}>
                {letters.map(letter => {
                  const count = samplesCollected[letter] || 0;
                  return (
                    <div 
                      key={letter}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '4px 0',
                        borderBottom: letter === currentLetter ? '2px solid #3b82f6' : 'none',
                        fontWeight: letter === currentLetter ? 'bold' : 'normal',
                        color: letter === currentLetter ? '#3b82f6' : '#374151'
                      }}
                    >
                      <span>{letter}</span>
                      <span style={{ 
                        color: count >= sessionStats.target ? '#10b981' : '#6b7280' 
                      }}>
                        {count}/{sessionStats.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #f59e0b',
              borderRadius: '12px', 
              padding: '15px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <strong>📝 Instructions:</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Show the ASL sign clearly to camera</li>
                <li>Click "Start Recording" to collect samples</li>
                <li>Hold the pose steady for 5+ seconds</li>
                <li>Watch for green "COLLECTING ✓" indicator</li>
                <li>Collect {sessionStats.target}+ samples per letter</li>
                <li>Use "Prev/Next" to navigate letters</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default DataCollectionPage; 