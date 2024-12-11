import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis/cloudflare';

export const config = {
  runtime: 'edge'
};

interface Score {
  name: string;
  score: number;
  date: string;
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
});

const SCORES_KEY = 'game:scores';

// Default scores
const defaultScores: Score[] = [
  { name: "CPU", score: 100, date: "2024-12-11T21:53:24Z" },
  { name: "BOT", score: 90, date: "2024-12-11T21:53:24Z" },
  { name: "AI", score: 80, date: "2024-12-11T21:53:24Z" }
];

export default async function handler(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    // Check Redis connection
    try {
      await redis.ping();
    } catch (error) {
      console.error('Redis connection error:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to Redis',
          env: {
            hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
            hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
          }
        },
        { status: 500, headers }
      );
    }

    // GET scores
    if (req.method === 'GET') {
      try {
        const scores = await redis.get<Score[]>(SCORES_KEY);
        if (!scores) {
          // Initialize with default scores if none exist
          await redis.set(SCORES_KEY, defaultScores);
          return NextResponse.json(defaultScores, { headers });
        }
        return NextResponse.json(scores, { headers });
      } catch (error) {
        console.error('Error fetching scores:', error);
        return NextResponse.json(defaultScores, { headers });
      }
    }

    // POST new score
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, score } = body;

      // Validate input
      if (!name || typeof score !== 'number') {
        return NextResponse.json(
          {
            error: 'Invalid score data',
            received: { name, score, typeofScore: typeof score }
          },
          { status: 400, headers }
        );
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

        return NextResponse.json(topScores, { headers });
      } catch (error) {
        console.error('Error saving score:', error);
        // Return current scores if save fails
        return NextResponse.json(scores, { headers });
      }
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        env: {
          hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
          hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
        }
      },
      { status: 500, headers }
    );
  }
}
