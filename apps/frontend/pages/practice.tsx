import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Webcam from 'react-webcam';
import { Hands } from '@mediapipe/hands';
import * as camUtils from '@mediapipe/camera_utils';

const PracticePage: React.FC = () => {
  const [currentWord, setCurrentWord] = useState('HELLO');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [predictedLetter, setPredictedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLetter = currentWord[currentLetterIndex];

  // Sample words for practice
  const practiceWords = ['HELLO', 'WORLD', 'ASL', 'LEARN', 'SIGN', 'LANGUAGE'];

  const captureFrame = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Send to AI service for prediction
        predictLetter(imageSrc);
      }
    }
  }, []);

  const predictLetter = async (imageSrc: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // TODO: Replace with actual AI service endpoint
      // const response = await fetch('/api/predict', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ image: imageSrc })
      // });
      // const data = await response.json();
      
      // Simulate AI prediction for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockPrediction = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random A-Z
      
      setPredictedLetter(mockPrediction);
      const correct = mockPrediction === currentLetter;
      setIsCorrect(correct);
      
      if (correct) {
        setScore(prev => prev + 1);
        // Move to next letter after a short delay
        setTimeout(() => {
          if (currentLetterIndex < currentWord.length - 1) {
            setCurrentLetterIndex(prev => prev + 1);
            setIsCorrect(null);
            setPredictedLetter(null);
          } else {
            // Word completed
            setCurrentWord(practiceWords[Math.floor(Math.random() * practiceWords.length)]);
            setCurrentLetterIndex(0);
            setIsCorrect(null);
            setPredictedLetter(null);
          }
        }, 1500);
      }
      
      setTotalAttempts(prev => prev + 1);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Start capturing frames every 2 seconds
    intervalRef.current = setInterval(captureFrame, 2000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [captureFrame]);

  const getFeedbackColor = () => {
    if (isCorrect === null) return '#4f8cff';
    return isCorrect ? '#10B981' : '#EF4444';
  };

  const getFeedbackText = () => {
    if (isCorrect === null) return 'Show the sign for:';
    return isCorrect ? 'Correct! 🎉' : `Try again! Expected: ${currentLetter}`;
  };

  return (
    <>
      <Head>
        <title>Practice ASL - SpellWithASL</title>
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
              Practice ASL 🤟
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
              Score: {score}/{totalAttempts} ({totalAttempts > 0 ? Math.round((score/totalAttempts)*100) : 0}%)
            </p>
          </div>
          <div style={{ width: 120 }}></div> {/* Spacer for centering */}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          maxWidth: 1200,
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {/* Webcam Section */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: '0 4px 24px rgba(79, 140, 255, 0.08)',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
              Your Camera
            </h2>
            <div style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              border: '3px solid #e5e7eb',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
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
                  Analyzing...
                </div>
              )}
            </div>
            {/* ASL Hand Reference for current letter */}
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

          {/* Practice Section */}
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

            {/* Prediction Display */}
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
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#1f2937' }}>
                  {predictedLetter}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticePage; 