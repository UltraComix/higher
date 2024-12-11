import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (!uri) {
        return res.status(500).json({ error: 'MongoDB URI not configured' });
    }

    try {
        await client.connect();
        const database = client.db('higher-lower');
        const scores = database.collection('scores');

        if (req.method === 'GET') {
            const topScores = await scores
                .find({})
                .sort({ score: -1 })
                .limit(10)
                .toArray();
            
            return res.status(200).json(topScores);
        }

        if (req.method === 'POST') {
            const { name, score } = req.body;
            
            if (!name || !score) {
                return res.status(400).json({ error: 'Name and score are required' });
            }

            const result = await scores.insertOne({
                name,
                score,
                date: new Date()
            });

            return res.status(201).json(result);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}
