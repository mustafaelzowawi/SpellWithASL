import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

const LandingPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>SpellWithASL 🤟</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f6fa 100%)',
        fontFamily: 'Poppins, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Faint background hand SVGs (OpenMoji ILY) */}
        <svg width="120" height="120" viewBox="0 0 72 72" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08, zIndex: 0 }}>
          <g>
            <path fill="#FCEA2B" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z"/>
            <path fill="#E27022" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z" opacity=".2"/>
          </g>
        </svg>
        <svg width="100" height="100" viewBox="0 0 72 72" style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.08, zIndex: 0 }}>
          <g>
            <path fill="#FCEA2B" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z"/>
            <path fill="#E27022" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z" opacity=".2"/>
          </g>
        </svg>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(79, 140, 255, 0.08)',
          padding: '3rem 2.5rem',
          maxWidth: 480,
          width: '90%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 600, marginBottom: '1.2rem', letterSpacing: '-1px' }}>
            SpellWithASL <span role="img" aria-label="ASL Hand">🤟</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#4f4f4f', marginBottom: '2.2rem', lineHeight: 1.6 }}>
            Welcome to <b>SpellWithASL</b> — an interactive platform to learn and practice American Sign Language (ASL) spelling using real-time AI gesture recognition. <br />
            <span style={{ color: '#4f8cff', fontWeight: 500 }}>Start your ASL journey now!</span>
          </p>
          <Link href="/practice">
            <button style={{
              padding: '1.1rem 2.5rem',
              fontSize: '1.15rem',
              borderRadius: 12,
              background: 'linear-gradient(90deg, #4f8cff 60%, #6fc3ff 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(79, 140, 255, 0.10)',
              transition: 'background 0.2s',
            }}>
              Start Learning
            </button>
          </Link>
          {/* Row of small hand outlines (OpenMoji ASL A, S, L, ILY) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 32 }}>
            {/* ASL 'A' */}
            <svg width="38" height="38" viewBox="0 0 72 72" fill="none">
              <g>
                <path fill="#FCEA2B" d="M36 12c-2 0-3 2-3 4v28h-2V16c0-2-2-4-4-4s-4 2-4 4v32c0 2 2 4 4 4h2v4c0 2 2 4 4 4s4-2 4-4v-4h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v28h-2V16c0-2-2-4-4-4z"/>
                <path fill="#E27022" d="M36 12c-2 0-3 2-3 4v28h-2V16c0-2-2-4-4-4s-4 2-4 4v32c0 2 2 4 4 4h2v4c0 2 2 4 4 4s4-2 4-4v-4h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v28h-2V16c0-2-2-4-4-4z" opacity=".2"/>
              </g>
            </svg>
            {/* ASL 'S' (fist) */}
            <svg width="38" height="38" viewBox="0 0 72 72" fill="none">
              <g>
                <ellipse cx="36" cy="36" rx="14" ry="18" fill="#FCEA2B" />
                <ellipse cx="36" cy="44" rx="8" ry="5" fill="#E27022" opacity=".2" />
              </g>
            </svg>
            {/* ASL 'L' */}
            <svg width="38" height="38" viewBox="0 0 72 72" fill="none">
              <g>
                <rect x="32" y="12" width="8" height="28" rx="4" fill="#FCEA2B" />
                <rect x="32" y="40" width="8" height="16" rx="4" fill="#E27022" opacity=".2" />
              </g>
            </svg>
            {/* ILY hand */}
            <svg width="38" height="38" viewBox="0 0 72 72" fill="none">
              <g>
                <path fill="#FCEA2B" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z"/>
                <path fill="#E27022" d="M36 12c-2 0-3 2-3 4v12h-2V16c0-2-2-4-4-4s-4 2-4 4v20c0 2 2 4 4 4h2v8c0 2 2 4 4 4s4-2 4-4v-8h2c2 0 4-2 4-4V16c0-2-2-4-4-4s-4 2-4 4v12h-2V16c0-2-2-4-4-4z" opacity=".2"/>
              </g>
            </svg>
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: 480, marginTop: 40 }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e0e7ef', margin: 0, marginBottom: 16 }} />
          <footer style={{ color: '#7b7b7b', fontSize: '1rem', fontWeight: 400, textAlign: 'center' }}>
            <span>SolutionHacks2025 &mdash; Made by Adan Khalid, Kavin Ainkaran, Mustafa Elzowawi 🤟</span>
          </footer>
        </div>
      </div>
    </>
  );
};

export default LandingPage; 