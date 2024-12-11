import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';

// Get MongoDB URI from environment variable
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env');
}

// Configure the client
const client = new MongoClient(uri, {
  maxPoolSize: 1,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 20000,
});

export default async function handler(req: NextRequest) {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db('higher');
    const collection = db.collection('scores');

    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    // Handle GET request
    if (req.method === 'GET') {
      const scores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      return NextResponse.json(scores, { headers });
    }

    // Handle POST request
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

      // Create new score
      const newScore = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      // Insert score
      await collection.insertOne(newScore);

      // Get updated scores
      const updatedScores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      return NextResponse.json(updatedScores, { headers });
    }

    // Handle invalid methods
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers }
    );
  } finally {
    // Don't close the client - let connection pooling handle it
  }
}
