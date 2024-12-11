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

// Static demo scores
const DEMO_SCORES: Score[] = [
  { name: "CPU", score: 100, date: "2024-12-11T21:29:14Z" },
  { name: "BOT", score: 90, date: "2024-12-11T21:29:14Z" },
  { name: "AI", score: 80, date: "2024-12-11T21:29:14Z" }
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
    if (req.method === 'GET') {
      return NextResponse.json(DEMO_SCORES, { headers });
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

      // Create new score
      const newScore: Score = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      // Return demo scores plus new score
      const allScores = [...DEMO_SCORES, newScore];
      allScores.sort((a, b) => b.score - a.score);
      const topScores = allScores.slice(0, 10);

      return NextResponse.json(topScores, { headers });
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
