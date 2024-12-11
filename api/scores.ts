import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

interface Score {
  name: string;
  score: number;
  date: string;
}

// File path for storing scores
const SCORES_FILE = path.join(process.cwd(), 'data', 'scores.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initialize scores file if it doesn't exist
if (!fs.existsSync(SCORES_FILE)) {
  fs.writeFileSync(SCORES_FILE, '[]');
}

// Read scores from file
function getScores(): Score[] {
  try {
    const data = fs.readFileSync(SCORES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return [];
  }
}

// Write scores to file
function saveScores(scores: Score[]) {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving scores:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET request - return scores
    if (req.method === 'GET') {
      const scores = getScores();
      return res.status(200).json(scores);
    }

    // POST request - add new score
    if (req.method === 'POST') {
      const { name, score } = req.body;

      // Validate input
      if (!name || typeof score !== 'number') {
        return res.status(400).json({
          error: 'Invalid score data',
          received: { name, score, typeofScore: typeof score }
        });
      }

      // Create new score
      const newScore: Score = {
        name: name.toUpperCase().slice(0, 3),
        score,
        date: new Date().toISOString()
      };

      // Get current scores
      const scores = getScores();

      // Add score and sort
      scores.push(newScore);
      scores.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      const topScores = scores.slice(0, 10);

      // Save scores
      saveScores(topScores);

      return res.status(200).json(topScores);
    }

    // Invalid method
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
