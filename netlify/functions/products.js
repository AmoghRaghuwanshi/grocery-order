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

  // Create table if not exists
  await sql`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    price NUMERIC NOT NULL,
    mrp NUMERIC,
    weight TEXT,
    emoji TEXT DEFAULT '🛒',
    available BOOLEAN DEFAULT true,
    img TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM products ORDER BY created_at ASC`;
      return new Response(JSON.stringify(rows), { headers });
    }

    if (req.method === 'POST') {
      const b = await req.json();
      const [row] = await sql`
        INSERT INTO products (name, cat, price, mrp, weight, emoji, available, img)
        VALUES (${b.name}, ${b.cat}, ${b.price}, ${b.mrp||null}, ${b.weight||''}, ${b.emoji||'🛒'}, ${b.available??true}, ${b.img||null})
        RETURNING *`;
      return new Response(JSON.stringify(row), { headers });
    }

    if (req.method === 'PUT') {
      const b = await req.json();
      const [row] = await sql`
        UPDATE products SET
          name=${b.name}, cat=${b.cat}, price=${b.price}, mrp=${b.mrp||null},
          weight=${b.weight||''}, emoji=${b.emoji||'🛒'}, available=${b.available??true}, img=${b.img||null}
        WHERE id=${b.id} RETURNING *`;
      return new Response(JSON.stringify(row), { headers });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      await sql`DELETE FROM products WHERE id=${id}`;
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/products' };