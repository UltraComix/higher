import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

// Create a new MongoClient for each request
async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  try {
    client = await connectToDatabase();
    const db = client.db('higher');
    const collection = db.collection('scores');

    if (req.method === 'GET') {
      const scores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      
      return res.status(200).json(scores);
    }

    if (req.method === 'POST') {
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ 
          error: 'Invalid score data',
          received: { name, score, typeofScore: typeof score }
        });
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

      return res.status(200).json(updatedScores);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
