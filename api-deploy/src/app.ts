import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());

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

function getDb() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('NEON_DATABASE_URL is not set');
  return drizzle(neon(url));
}

app.get('/status', (_req, res) => {
  res.json({ ok: true });
});

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
  const level = req.body;
  if (!level?.id || typeof level.id !== 'string') {
    res.status(400).json({ error: 'Missing id' });
    return;
  }
  try {
    const db = getDb();
    await db
      .insert(communityLevels)
      .values({ ...level, createdByPlayer: false, published: true, plays: level.plays ?? 0, likes: level.likes ?? 0, publishedAtTs: new Date() })
      .onConflictDoUpdate({
        target: communityLevels.id,
        set: { name: level.name, size: level.size, elements: level.elements, zones: level.zones, canonicalSolution: level.canonicalSolution, updatedAt: level.updatedAt, publishedAt: level.publishedAt, published: true, publishedAtTs: new Date() },
      });
    res.status(201).json({ ok: true, id: level.id });
  } catch (err) {
    console.error('publish error', err);
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
    await db.update(communityLevels).set({ plays: sql`${communityLevels.plays} + 1` }).where(eq(communityLevels.id, req.params.id));
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
    await db.update(communityLevels).set({ likes: sql`GREATEST(0, ${communityLevels.likes} + ${change})` }).where(eq(communityLevels.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('like error', err);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

export default app;
