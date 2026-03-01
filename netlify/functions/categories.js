import { neon } from '@netlify/neon';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const sql = neon();

  await sql`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    emoji TEXT DEFAULT '🏷️',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // Seed defaults if empty
  const [{ count }] = await sql`SELECT COUNT(*)::int as count FROM categories`;
  if (count === 0) {
    await sql`INSERT INTO categories (name, emoji) VALUES
      ('Vegetables','🥦'),('Fruits','🍎'),('Dairy','🥛'),('Bakery','🍞'),('Snacks','🍿')`;
  }

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM categories ORDER BY created_at ASC`;
      return new Response(JSON.stringify(rows), { headers });
    }

    if (req.method === 'POST') {
      const { name, emoji } = await req.json();
      const [row] = await sql`INSERT INTO categories (name, emoji) VALUES (${name}, ${emoji||'🏷️'}) RETURNING *`;
      return new Response(JSON.stringify(row), { headers });
    }

    if (req.method === 'PUT') {
      const { id, name, emoji, oldName } = await req.json();
      const [row] = await sql`UPDATE categories SET name=${name}, emoji=${emoji||'🏷️'} WHERE id=${id} RETURNING *`;
      // Update products that used the old category name
      if (oldName && oldName !== name) {
        await sql`UPDATE products SET cat=${name} WHERE cat=${oldName}`;
      }
      return new Response(JSON.stringify(row), { headers });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      await sql`DELETE FROM categories WHERE id=${id}`;
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/categories' };