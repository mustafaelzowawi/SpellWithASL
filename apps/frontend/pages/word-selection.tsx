import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

const WordSelectionPage: React.FC = () => {
  const [customWord, setCustomWord] = useState('');
  const router = useRouter();

  // Preset word options
  const presetWords = [
    'HELLO',
    'WORLD',
    'LOVE',
    'PEACE',
    'THANK',
    'PLEASE',
    'HELP',
    'YES',
    'NO',
    'FAMILY'
  ];

  const handleCustomWordSubmit = () => {
    const word = customWord.trim().toUpperCase();
    if (word.length > 0 && /^[A-Z]+$/.test(word)) {
      router.push(`/practice-enhanced?word=${encodeURIComponent(word)}`);
    } else {
      alert('Please enter a valid word (letters only)');
    }
  };

  const handlePresetWordSelect = (word: string) => {
    router.push(`/practice-enhanced?word=${encodeURIComponent(word)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomWordSubmit();
    }
  };

  return (
    <>
      <Head>
        <title>Select Word - SpellWithASL</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        padding: '20px', 
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '40px',
          position: 'relative'
        }}>
          {/* Back button */}
          <Link href="/">
            <button style={{ 
              position: 'absolute',
              top: '20px',
              left: '20px',
              padding: '8px 16px', 
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
              ← Back
            </button>
          </Link>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              width: '48px',
              height: '48px',
              background: '#3b82f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '20px'
            }}>
              📝
            </div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#0f172a', 
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.025em'
            }}>
              Choose Your Word
            </h1>
            <p style={{ 
              color: '#64748b', 
              fontSize: '16px',
              margin: 0,
              lineHeight: 1.5
            }}>
              Select a word to practice spelling in ASL
            </p>
          </div>

          {/* Custom Word Input */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              color: '#0f172a', 
              fontSize: '18px', 
              marginBottom: '16px',
              fontWeight: 500
            }}>
              Type Your Own Word
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter a word..."
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  background: '#ffffff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                onClick={handleCustomWordSubmit}
                disabled={!customWord.trim()}
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: 500,
                  background: customWord.trim() ? '#3b82f6' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: customWord.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (customWord.trim()) {
                    e.currentTarget.style.background = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (customWord.trim()) {
                    e.currentTarget.style.background = '#3b82f6';
                  }
                }}
              >
                Start →
              </button>
            </div>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '14px', 
              marginTop: '8px',
              margin: '8px 0 0 0'
            }}>
              Letters only, no spaces or numbers
            </p>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '32px 0',
            color: '#94a3b8'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ padding: '0 16px', fontSize: '14px' }}>or choose from below</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {/* Preset Words */}
          <div>
            <h2 style={{ 
              color: '#0f172a', 
              fontSize: '18px', 
              marginBottom: '16px',
              fontWeight: 500
            }}>
              Popular Words
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '12px'
            }}>
              {presetWords.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePresetWordSelect(word)}
                  style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WordSelectionPage; 