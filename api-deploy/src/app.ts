import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';
import { eq, desc, asc, sql } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

// ── Schema ────────────────────────────────────────────────────────────────────

const communityLevels = pgTable('community_levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  elements: jsonb('elements').notNull(),
  zones: jsonb('zones').notNull(),
  canonicalSolution: jsonb('canonical_solution').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
  published: boolean('published').notNull().default(true),
  plays: integer('plays').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  createdByPlayer: boolean('created_by_player').notNull().default(false),
  publishedAtTs: timestamp('published_at_ts').defaultNow(),
});

const endlessLeaderboard = pgTable('endless_leaderboard', {
  id: serial('id').primaryKey(),
  playerName: text('player_name').notNull(),
  totalScore: integer('total_score').notNull(),
  levelsCompleted: integer('levels_completed').notNull(),
  totalMistakes: integer('total_mistakes').notNull().default(0),
  totalTimeMs: integer('total_time_ms').notNull().default(0),
  highestGrid: integer('highest_grid').notNull().default(4),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

const hardcoreLeaderboard = pgTable('hardcore_leaderboard', {
  id: serial('id').primaryKey(),
  playerName: text('player_name').notNull(),
  levelReached: integer('level_reached').notNull(),
  totalTimeMs: integer('total_time_ms').notNull().default(0),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// ── DB factory (Neon HTTP — works in serverless) ──────────────────────────────

function getDb() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('NEON_DATABASE_URL is not set');
  return drizzle(neon(url));
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isString(v: unknown): v is string { return typeof v === 'string'; }
function isNumber(v: unknown): v is number { return typeof v === 'number' && isFinite(v); }
function isArray(v: unknown): v is unknown[] { return Array.isArray(v); }

function validateCommunityLevel(level: Record<string, unknown>): string | null {
  if (!isString(level.id) || level.id.length < 4 || level.id.length > 64) return 'Invalid id';
  if (!isString(level.name) || level.name.trim().length < 1 || level.name.length > 60) return 'Invalid name';
  if (!isNumber(level.size) || level.size < 3 || level.size > 10) return 'Invalid size';
  if (!isArray(level.elements) || level.elements.length > 20) return 'Invalid elements';
  if (!isArray(level.zones) || level.zones.length < 1 || level.zones.length > 50) return 'Invalid zones';
  if (!isArray(level.canonicalSolution)) return 'Invalid canonicalSolution';
  if (!isString(level.createdAt) || !isString(level.updatedAt)) return 'Invalid timestamps';
  return null;
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/status', (_req, res) => {
  res.json({ ok: true });
});

// ── Community ─────────────────────────────────────────────────────────────────

app.post('/api/community/init', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/community/levels', async (_req, res) => {
  try {
    const db = getDb();
    const levels = await db
      .select()
      .from(communityLevels)
      .where(eq(communityLevels.published, true))
      .orderBy(desc(communityLevels.publishedAtTs));
    res.json(levels);
  } catch (err) {
    console.error('list error', err);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

app.get('/api/community/status', async (_req, res) => {
  try {
    const db = getDb();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityLevels)
      .where(eq(communityLevels.published, true));
    res.json({ queuedUploads: 0, queuedDeletes: 0, rateLimited: false, nextRefreshIn: 180, totalLevels: count });
  } catch {
    res.json({ queuedUploads: 0, queuedDeletes: 0, rateLimited: false, nextRefreshIn: 180, totalLevels: 0 });
  }
});

app.post('/api/community/publish', async (req, res) => {
  const level = req.body as Record<string, unknown>;
  const err = validateCommunityLevel(level);
  if (err) { res.status(400).json({ error: err }); return; }

  try {
    const db = getDb();
    await db
      .insert(communityLevels)
      .values({
        id: level.id as string,
        name: (level.name as string).trim(),
        size: level.size as number,
        elements: level.elements as unknown[],
        zones: level.zones as unknown[],
        canonicalSolution: level.canonicalSolution as unknown[],
        createdAt: level.createdAt as string,
        updatedAt: level.updatedAt as string,
        publishedAt: isString(level.publishedAt) ? level.publishedAt : null,
        createdByPlayer: level.createdByPlayer === true,
        published: true,
        plays: isNumber(level.plays) ? level.plays : 0,
        likes: isNumber(level.likes) ? level.likes : 0,
        publishedAtTs: new Date(),
      })
      .onConflictDoUpdate({
        target: communityLevels.id,
        set: {
          name: (level.name as string).trim(),
          size: level.size as number,
          elements: level.elements as unknown[],
          zones: level.zones as unknown[],
          canonicalSolution: level.canonicalSolution as unknown[],
          updatedAt: level.updatedAt as string,
          publishedAt: isString(level.publishedAt) ? level.publishedAt : null,
          published: true,
          publishedAtTs: new Date(),
        },
      });
    res.status(201).json({ ok: true, id: level.id });
  } catch (e) {
    console.error('publish error', e);
    res.status(500).json({ error: 'Failed to publish level' });
  }
});

app.delete('/api/community/levels/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.delete(communityLevels).where(eq(communityLevels.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('delete error', err);
    res.status(500).json({ error: 'Failed to delete level' });
  }
});

app.post('/api/community/levels/:id/play', async (req, res) => {
  try {
    const db = getDb();
    await db
      .update(communityLevels)
      .set({ plays: sql`${communityLevels.plays} + 1` })
      .where(eq(communityLevels.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('play error', err);
    res.status(500).json({ error: 'Failed to increment plays' });
  }
});

app.post('/api/community/levels/:id/like', async (req, res) => {
  try {
    const db = getDb();
    const { delta } = req.body as { delta?: number };
    const change = delta === -1 ? -1 : 1;
    await db
      .update(communityLevels)
      .set({ likes: sql`GREATEST(0, ${communityLevels.likes} + ${change})` })
      .where(eq(communityLevels.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('like error', err);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

// ── Endless Leaderboard ───────────────────────────────────────────────────────

app.get('/api/leaderboard/endless', async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(endlessLeaderboard)
      .orderBy(desc(endlessLeaderboard.totalScore))
      .limit(50);
    res.json(rows);
  } catch (err) {
    console.error('endless lb GET error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/leaderboard/endless', async (req, res) => {
  const { playerName, totalScore, levelsCompleted, totalMistakes, totalTimeMs, highestGrid } =
    req.body as Record<string, unknown>;

  if (!isString(playerName) || !playerName.trim()) { res.status(400).json({ error: 'Invalid playerName' }); return; }
  if (!isNumber(totalScore)) { res.status(400).json({ error: 'Invalid totalScore' }); return; }
  if (!isNumber(levelsCompleted) || levelsCompleted < 1) { res.status(400).json({ error: 'Invalid levelsCompleted' }); return; }

  try {
    const db = getDb();
    await db.insert(endlessLeaderboard).values({
      playerName: playerName.trim().slice(0, 20),
      totalScore: Math.min(totalScore, 999999),
      levelsCompleted: Math.min(levelsCompleted, 9999),
      totalMistakes: isNumber(totalMistakes) ? Math.min(totalMistakes, 99999) : 0,
      totalTimeMs: isNumber(totalTimeMs) ? totalTimeMs : 0,
      highestGrid: isNumber(highestGrid) ? Math.min(Math.max(highestGrid, 3), 10) : 4,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('endless lb POST error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── Hardcore Leaderboard ──────────────────────────────────────────────────────

app.get('/api/leaderboard/hardcore', async (_req, res) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(hardcoreLeaderboard)
      .orderBy(desc(hardcoreLeaderboard.levelReached), asc(hardcoreLeaderboard.totalTimeMs))
      .limit(50);
    res.json(rows);
  } catch (err) {
    console.error('hardcore lb GET error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/leaderboard/hardcore', async (req, res) => {
  const { playerName, levelReached, totalTimeMs } = req.body as Record<string, unknown>;

  if (!isString(playerName) || !playerName.trim()) { res.status(400).json({ error: 'Invalid playerName' }); return; }
  if (!isNumber(levelReached) || levelReached < 1) { res.status(400).json({ error: 'Invalid levelReached' }); return; }

  try {
    const db = getDb();
    await db.insert(hardcoreLeaderboard).values({
      playerName: playerName.trim().slice(0, 20),
      levelReached: Math.min(levelReached, 9999),
      totalTimeMs: isNumber(totalTimeMs) ? totalTimeMs : 0,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('hardcore lb POST error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

export default app;
