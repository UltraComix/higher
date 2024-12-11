import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env');
}

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
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
        return res.status(400).json({ error: 'Invalid score data' });
      }

      const result = await collection.insertOne({
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      });

      const updatedScores = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      return res.status(200).json(updatedScores);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
