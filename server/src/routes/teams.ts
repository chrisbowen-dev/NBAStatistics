import express, { Request, Response } from 'express';
import axios from 'axios';
import Team from '../models/Team';
import Player from '../models/Player';

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

// Get a team's roster players enriched with their latest-season per-game stats.
// Merges the team's roster (authoritative for name/position/number) with each
// player's most recent careerStats entry from the players collection.
router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const team = await Team.findOne({ id });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const roster = (team.get('roster') as Array<Record<string, unknown>>) || [];
    const playerIds = roster
      .map(r => r['PLAYER_ID'] as number)
      .filter((pid): pid is number => typeof pid === 'number');

    const players = await Player.find({ id: { $in: playerIds } });

    // Map player id -> latest-season stats (last entry in careerStats).
    const statsById = new Map<number, Record<string, unknown> | null>();
    for (const p of players) {
      const career = (p.get('careerStats') as Array<Record<string, unknown>>) || [];
      statsById.set(p.get('id') as number, career.length ? career[career.length - 1]! : null);
    }

    const result = roster.map(r => {
      const pid = r['PLAYER_ID'] as number;
      const s = statsById.get(pid) ?? null;
      return {
        PLAYER_ID: pid,
        PLAYER: r['PLAYER'] ?? null,
        POSITION: r['POSITION'] ?? null,
        NUM: r['NUM'] ?? null,
        stats: s
          ? {
              GP: s['GP'] ?? null,
              MIN: s['MIN'] ?? null,
              PTS: s['PTS'] ?? null,
              REB: s['REB'] ?? null,
              AST: s['AST'] ?? null,
              STL: s['STL'] ?? null,
              BLK: s['BLK'] ?? null,
              FG_PCT: s['FG_PCT'] ?? null,
              FG3_PCT: s['FG3_PCT'] ?? null,
              FT_PCT: s['FT_PCT'] ?? null,
            }
          : null,
      };
    });

    res.json(result);
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

    if (cached) return res.json(cached);

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
