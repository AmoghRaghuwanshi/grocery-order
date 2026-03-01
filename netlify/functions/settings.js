import { neon } from '@netlify/neon';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const DEFAULTS = { storeName:'Apna Mart', phone:'+91 98765 43210', flatFee:30, freeOver:500, adminPass:'admin123' };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const sql = neon();

  await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value JSONB)`;
  await sql`INSERT INTO settings (key, value) VALUES ('store', ${JSON.stringify(DEFAULTS)}) ON CONFLICT (key) DO NOTHING`;

  try {
    if (req.method === 'GET') {
      const [row] = await sql`SELECT value FROM settings WHERE key='store'`;
      return new Response(JSON.stringify(row?.value || DEFAULTS), { headers });
    }

    if (req.method === 'POST') {
      const b = await req.json();
      await sql`INSERT INTO settings (key, value) VALUES ('store', ${JSON.stringify(b)}) ON CONFLICT (key) DO UPDATE SET value=${JSON.stringify(b)}`;
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/settings' };