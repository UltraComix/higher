import { MongoClient, ServerApiVersion } from 'mongodb';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East (N. Virginia)
};

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(process.env.MONGODB_URI!, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  cachedClient = client;
  return client;
}

async function handler(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('higher');
    const collection = db.collection('scores');

    if (req.method === 'GET') {
      const scores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      
      return new Response(JSON.stringify(scores), { 
        headers,
        status: 200 
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { name, score } = body;
      
      if (!name || typeof score !== 'number') {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid score data',
            received: { name, score, typeofScore: typeof score }
          }), 
          { headers, status: 400 }
        );
      }

      const newScore = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      await collection.insertOne(newScore);

      const updatedScores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      return new Response(JSON.stringify(updatedScores), { 
        headers,
        status: 200 
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { headers, status: 405 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { headers, status: 500 }
    );
  }
}

export default handler;
