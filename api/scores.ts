import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

interface Score {
  name: string;
  score: number;
  date: string;
}

// Initialize Redis client
const redis = Redis.fromEnv();

const SCORES_KEY = 'game:scores';

// Default scores if none exist
const defaultScores: Score[] = [
  { name: "CPU", score: 100, date: "2024-12-11T21:50:08Z" },
  { name: "BOT", score: 90, date: "2024-12-11T21:50:08Z" },
  { name: "AI", score: 80, date: "2024-12-11T21:50:08Z" }
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
    // Check Redis connection
    try {
      await redis.ping();
    } catch (error) {
      console.error('Redis connection error:', error);
      throw new Error('Failed to connect to Redis');
    }

    // GET scores
    if (req.method === 'GET') {
      try {
        const scores = await redis.get<Score[]>(SCORES_KEY);
        if (!scores) {
          // Initialize with default scores if none exist
          await redis.set(SCORES_KEY, defaultScores);
          return res.status(200).json(defaultScores);
        }
        return res.status(200).json(scores);
      } catch (error) {
        console.error('Error fetching scores:', error);
        throw new Error('Failed to fetch scores');
      }
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

      try {
        // Create new score
        const newScore: Score = {
          name: name.toUpperCase().slice(0, 3),
          score,
          date: new Date().toISOString()
        };

        // Get existing scores
        let scores = await redis.get<Score[]>(SCORES_KEY);
        if (!scores) scores = defaultScores;

        // Add new score and sort
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 10);

        // Save scores
        await redis.set(SCORES_KEY, topScores);

        return res.status(200).json(topScores);
      } catch (error) {
        console.error('Error saving score:', error);
        throw new Error('Failed to save score');
      }
    }

    // Invalid method
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      env: {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  }
}
