import type { NextApiRequest, NextApiResponse } from 'next';

interface Score {
  name: string;
  score: number;
  date: string;
}

// In-memory cache for development
let scores: Score[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET request - return scores
    if (req.method === 'GET') {
      return res.status(200).json(scores);
    }

    // POST request - add new score
    if (req.method === 'POST') {
      const { name, score } = req.body;

      // Validate input
      if (!name || typeof score !== 'number') {
        return res.status(400).json({
          error: 'Invalid score data',
          received: { name, score, typeofScore: typeof score }
        });
      }

      // Create new score
      const newScore: Score = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      // Add score and sort
      scores.push(newScore);
      scores.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      scores = scores.slice(0, 10);

      return res.status(200).json(scores);
    }

    // Invalid method
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
