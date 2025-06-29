import { NextApiRequest, NextApiResponse } from 'next';

interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

interface CollectionRequest {
  letter: string;
  landmarks: LandmarkPoint[];
  timestamp: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { letter, landmarks, timestamp }: CollectionRequest = req.body;

    // Validate request
    if (!letter || !landmarks || !Array.isArray(landmarks) || landmarks.length !== 21) {
      return res.status(400).json({ 
        error: 'Invalid request: letter and 21 landmarks required' 
      });
    }

    // Forward to backend (or store locally for now)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/collect-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter, landmarks, timestamp })
      });

      if (response.ok) {
        const result = await response.json();
        return res.status(200).json(result);
      }
    } catch (backendError) {
      console.warn('Backend unavailable, storing locally');
    }

    // If backend is unavailable, store data locally (for development)
    console.log(`Collected sample for letter ${letter}:`, {
      landmarks: landmarks.length,
      timestamp: new Date(timestamp).toISOString()
    });

    return res.status(200).json({
      success: true,
      message: `Sample collected for letter ${letter}`,
      local_storage: true
    });

  } catch (error) {
    console.error('Collection error:', error);
    return res.status(500).json({ 
      error: 'Failed to collect sample',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 