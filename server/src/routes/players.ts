import express, { Request, Response } from 'express';
import Player from '../models/Player';

const router = express.Router();

// Search players
router.get('/', async (req: Request, res: Response) => {
  try {
    const { name = '' } = req.query;
    const nameStr = Array.isArray(name)
      ? String(name[0] ?? '')
      : String(name ?? '');
    const query = nameStr ? { full_name: new RegExp(nameStr, 'i') } : {};
    const players = await Player.find(query).limit(500);
    res.json(players);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// Get single player
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const player = await Player.findOne({ id });

    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
