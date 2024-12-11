import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

interface Score {
  name: string;
  score: number;
  date: string;
}

const SCORES_KEY = 'game:scores';

// In-memory scores (will reset on deploy)
let scores: Score[] = [
  { name: "CPU", score: 100, date: "2024-12-11T21:31:01Z" },
  { name: "BOT", score: 90, date: "2024-12-11T21:31:01Z" },
  { name: "AI", score: 80, date: "2024-12-11T21:31:01Z" }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET scores
    if (req.method === 'GET') {
      const scores = await kv.get<Score[]>(SCORES_KEY) || [];
      return res.status(200).json(scores);
    }

    // POST new score
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

      // Get existing scores
      const existingScores = await kv.get<Score[]>(SCORES_KEY) || scores;

      // Add new score and sort
      existingScores.push(newScore);
      existingScores.sort((a, b) => b.score - a.score);
      const topScores = existingScores.slice(0, 10);

      // Save scores
      await kv.set(SCORES_KEY, topScores);

      return res.status(200).json(topScores);
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
