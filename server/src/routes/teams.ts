import express, { Request, Response } from 'express';
import axios from 'axios';
import Team from '../models/Team';

const router = express.Router();

const PYTHON_URL = process.env.PYTHON_API_URL;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isFresh(doc: { lastUpdated?: Date }): boolean {
  return doc?.lastUpdated !== undefined &&
    (Date.now() - new Date(doc.lastUpdated).getTime()) < CACHE_TTL_MS;
}

// Get all teams
router.get('/', async (req: Request, res: Response) => {
  try {
    const cached = await Team.find({});
    if (cached.length === 30) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/teams`);
    res.json(data);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// Get single team
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const cached = await Team.findOne({ id });

    if (cached && isFresh(cached)) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/teams/${String(id)}`);
    const updated = await Team.findOneAndUpdate(
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
