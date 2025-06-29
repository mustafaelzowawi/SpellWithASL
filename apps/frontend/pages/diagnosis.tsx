import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface TrainingDataAnalysis {
  letter_distribution: Record<string, number>;
  potential_issues: string[];
  recommendations: string[];
  similar_letters: Record<string, { description: string }>;
}

const DiagnosisPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<TrainingDataAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/analyze-training-data');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalysis(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const getSeverityColor = (issue: string) => {
    if (issue.includes('Invalid landmark') || issue.includes('parsing error')) {
      return '#dc3545'; // Red for critical issues
    }
    if (issue.includes('too small') || issue.includes('underrepresented')) {
      return '#fd7e14'; // Orange for warnings
    }
    return '#198754'; // Green for info
  };

  const totalSamples = analysis ? Object.values(analysis.letter_distribution).reduce((a, b) => a + b, 0) : 0;
  const avgSamples = totalSamples / (analysis ? Object.keys(analysis.letter_distribution).length : 1);

  return (
    <>
      <Head>
        <title>Training Data Diagnosis - SpellWithASL</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🔬 Training Data Diagnosis
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              Analyze your ASL training data quality and model performance
            </p>
          </div>

          {/* Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '15px', 
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                🏠 Home
              </button>
            </Link>
            <Link href="/data-collection" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                📊 Collect More Data
              </button>
            </Link>
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              style={{
                background: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '🔄 Analyzing...' : '🔄 Refresh Analysis'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div style={{ display: 'grid', gap: '20px' }}>
              
              {/* Overview Stats */}
              <div style={{
                background: '#e7f3ff',
                border: '1px solid #bee5eb',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <h2 style={{ color: '#004085', marginBottom: '15px' }}>📈 Dataset Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>{totalSamples}</div>
                    <div style={{ color: '#666' }}>Total Samples</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                      {Object.keys(analysis.letter_distribution).length}
                    </div>
                    <div style={{ color: '#666' }}>Letters Covered</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                      {avgSamples.toFixed(1)}
                    </div>
                    <div style={{ color: '#666' }}>Average/Letter</div>
                  </div>
                </div>
              </div>

              {/* Letter Distribution */}
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <h2 style={{ color: '#495057', marginBottom: '15px' }}>📊 Letter Distribution</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {Object.entries(analysis.letter_distribution).map(([letter, count]) => (
                    <div
                      key={letter}
                      style={{
                        background: count < 5 ? '#f8d7da' : count < avgSamples * 0.7 ? '#fff3cd' : '#d1edff',
                        border: '1px solid ' + (count < 5 ? '#f5c6cb' : count < avgSamples * 0.7 ? '#ffeaa7' : '#bee5eb'),
                        borderRadius: '8px',
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{letter}</div>
                      <div style={{ color: '#666' }}>{count}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  <span style={{ background: '#f8d7da', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>
                    ❌ &lt; 5 samples
                  </span>
                  <span style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>
                    ⚠️ Below average
                  </span>
                  <span style={{ background: '#d1edff', padding: '2px 6px', borderRadius: '4px' }}>
                    ✅ Good coverage
                  </span>
                </div>
              </div>

              {/* Issues & Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Issues */}
                <div style={{
                  background: '#fff8e1',
                  border: '1px solid #ffecb3',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <h2 style={{ color: '#ef6c00', marginBottom: '15px' }}>⚠️ Potential Issues</h2>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {analysis.potential_issues.map((issue, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'white',
                          border: `1px solid ${getSeverityColor(issue)}`,
                          borderLeft: `4px solid ${getSeverityColor(issue)}`,
                          borderRadius: '6px',
                          padding: '10px',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div style={{
                  background: '#e8f5e8',
                  border: '1px solid #c3e6cb',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <h2 style={{ color: '#155724', marginBottom: '15px' }}>💡 Recommendations</h2>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {analysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'white',
                          border: '1px solid #c3e6cb',
                          borderLeft: '4px solid #28a745',
                          borderRadius: '6px',
                          padding: '10px',
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similar Letters Warning */}
              <div style={{
                background: '#ffecd1',
                border: '1px solid #fdcb6e',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <h2 style={{ color: '#a0522d', marginBottom: '15px' }}>🔄 Confusing Letter Pairs</h2>
                <p style={{ color: '#856404', marginBottom: '15px' }}>
                  These letter pairs are commonly confused by ASL recognition models:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {Object.entries(analysis.similar_letters).map(([pair, info]) => (
                    <div
                      key={pair}
                      style={{
                        background: 'white',
                        border: '1px solid #fdcb6e',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#a0522d', marginBottom: '5px' }}>
                        {pair.replace('_vs_', ' vs ')}
                      </div>
                      <div style={{ color: '#856404' }}>
                        {info.description}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  background: '#fff3cd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#856404'
                }}>
                  <strong>💡 Tip:</strong> For confusing pairs like G vs H, collect 15+ samples each with very clear, distinct poses.
                </div>
              </div>

            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
              <div style={{ fontSize: '1.2rem', color: '#666' }}>Analyzing training data...</div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default DiagnosisPage; 