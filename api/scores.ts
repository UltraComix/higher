import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env');
}

const client = new MongoClient(uri);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('API Route hit:', req.method);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('higher');
    const collection = db.collection('scores');

    if (req.method === 'GET') {
      console.log('Fetching scores...');
      const scores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      
      console.log('Fetched scores:', scores);
      return res.status(200).json(scores);
    }

    if (req.method === 'POST') {
      console.log('Received POST data:', req.body);
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        console.error('Invalid data:', { name, score });
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
      
      console.log('Inserting score:', newScore);
      await collection.insertOne(newScore);

      const updatedScores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      console.log('Returning updated scores:', updatedScores);
      return res.status(200).json(updatedScores);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}
