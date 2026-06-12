import express, { Request, Response } from 'express';
import axios from 'axios';
import Player from '../models/Player';

const router = express.Router();

const PYTHON_URL = process.env.PYTHON_API_URL;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isFresh(doc: { lastUpdated?: Date }): boolean {
  return doc?.lastUpdated !== undefined &&
    (Date.now() - new Date(doc.lastUpdated).getTime()) < CACHE_TTL_MS;
}

// Search players
router.get('/', async (req: Request, res: Response) => {
  try {
    const { name = '' } = req.query;
    const nameStr = Array.isArray(name)
      ? String(name[0] ?? '')
      : String(name ?? '');
    const query = nameStr ? { full_name: new RegExp(nameStr, 'i') } : {};
    const cached = await Player.find(query).limit(500);
    if (cached.length > 0) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/players/search?name=${nameStr}`);
    res.json(data);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// Get single player
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const cached = await Player.findOne({ id });

    if (cached) return res.json(cached);

    console.log('Player not found in cache. PYTHON_URL:', PYTHON_URL, 'ID:', id);
    const { data } = await axios.get(`${PYTHON_URL}/players/${String(id)}`);
    const updated = await Player.findOneAndUpdate(
      { id },
      { ...data, id, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
