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
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '40px',
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '30px' }}>
            <Link href="/">
              <button style={{ 
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '10px 20px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                ← Home
              </button>
            </Link>
            <h1 style={{ 
              margin: '0 0 10px 0', 
              color: '#333', 
              fontSize: '2.5rem',
              fontWeight: '600'
            }}>
              Choose Your Word 🤟
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '1.1rem',
              margin: 0
            }}>
              Select a word to practice spelling in ASL
            </p>
          </div>

          {/* Custom Word Input */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: '#333', 
              fontSize: '1.3rem', 
              marginBottom: '15px',
              fontWeight: '500'
            }}>
              ✏️ Enter Your Own Word
            </h2>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Type a word..."
                style={{
                  padding: '15px 20px',
                  fontSize: '1.1rem',
                  border: '2px solid #ddd',
                  borderRadius: '12px',
                  minWidth: '250px',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              <button
                onClick={handleCustomWordSubmit}
                disabled={!customWord.trim()}
                style={{
                  padding: '15px 25px',
                  fontSize: '1.1rem',
                  background: customWord.trim() ? 'linear-gradient(90deg, #4f8cff 60%, #6fc3ff 100%)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: customWord.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                Start Practicing →
              </button>
            </div>
            <p style={{ 
              color: '#888', 
              fontSize: '0.9rem', 
              marginTop: '10px',
              fontStyle: 'italic'
            }}>
              Letters only, no spaces or numbers
            </p>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '30px 0',
            color: '#888'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            <span style={{ padding: '0 20px', fontSize: '1rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          </div>

          {/* Preset Words */}
          <div>
            <h2 style={{ 
              color: '#333', 
              fontSize: '1.3rem', 
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              🎯 Choose from Popular Words
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '15px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {presetWords.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePresetWordSelect(word)}
                  style={{
                    padding: '15px 10px',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    color: '#333',
                    border: '2px solid #dee2e6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #007bff 0%, #4f8cff 100%)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#007bff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 140, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.borderColor = '#dee2e6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {word}
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    marginTop: '2px'
                  }}>
                    {word.length} letters
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            <p style={{ 
              color: '#666', 
              fontSize: '0.9rem', 
              margin: 0,
              lineHeight: '1.5'
            }}>
              💡 <strong>Tip:</strong> Start with shorter words if you're new to ASL. 
              The AI will guide you through each letter step by step!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WordSelectionPage; 