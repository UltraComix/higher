import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

interface Score {
  name: string;
  score: number;
  date: string;
}

// In-memory cache for development
let scores: Score[] = [];

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
    if (req.method === 'GET') {
      return NextResponse.json(scores, { headers });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { name, score } = body;

      if (!name || typeof score !== 'number') {
        return NextResponse.json(
          {
            error: 'Invalid score data',
            received: { name, score, typeofScore: typeof score }
          },
          { status: 400, headers }
        );
      }

      const newScore: Score = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      // Add new score and sort
      scores.push(newScore);
      scores.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      scores = scores.slice(0, 10);

      return NextResponse.json(scores, { headers });
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
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers }
    );
  }
}
