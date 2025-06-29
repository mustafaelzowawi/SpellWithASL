import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

const LandingPage: React.FC = () => {
  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <>
      <Head>
        <title>SpellWithASL</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '20px',
        position: 'relative',
      }}>
        {/* Dev Tools Dropdown */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                background: showDevTools ? '#e2e8f0' : '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                if (!showDevTools) {
                  e.currentTarget.style.background = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!showDevTools) {
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
            >
              ⚙️ Dev
              <span style={{ 
                fontSize: '10px',
                transform: showDevTools ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                ▼
              </span>
            </button>
            
            {showDevTools && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                minWidth: '140px'
              }}>
                <Link href="/data-collection">
                  <button style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    background: 'transparent',
                    color: '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '0',
                    borderTopLeftRadius: '7px',
                    borderTopRightRadius: '7px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    📊 Collect Data
                  </button>
                </Link>
                
                <Link href="/diagnosis">
                  <button style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    background: 'transparent',
                    color: '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    🔬 Debug Data
                  </button>
                </Link>
                
                <Link href="/test-mediapipe">
                  <button style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    background: 'transparent',
                    color: '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '0',
                    borderBottomLeftRadius: '7px',
                    borderBottomRightRadius: '7px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    📷 Test Camera
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '48px 40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ 
            width: '64px',
            height: '64px',
            background: '#3b82f6',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            fontSize: '28px'
          }}>
            🤟
          </div>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 600, 
            color: '#0f172a',
            marginBottom: '12px',
            letterSpacing: '-0.025em'
          }}>
            SpellWithASL
          </h1>
          
          <p style={{ 
            fontSize: '16px', 
            color: '#64748b', 
            marginBottom: '32px', 
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto 32px auto'
          }}>
            Learn American Sign Language spelling with real-time AI gesture recognition
          </p>
          
          <Link href="/word-selection">
            <button style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '12px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Start Learning
            </button>
          </Link>
        </div>
        
        <footer style={{ 
          marginTop: '32px',
          color: '#94a3b8', 
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          SolutionHacks2025 • Made by Adan Khalid, Kavin Ainkaran, Mustafa Elzowawi
        </footer>
      </div>
    </>
  );
};

export default LandingPage; 