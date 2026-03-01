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

  await sql`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer TEXT,
    phone TEXT,
    address TEXT,
    items JSONB,
    subtotal NUMERIC,
    delivery_fee NUMERIC,
    total NUMERIC,
    payment TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  try {
    if (req.method === 'GET') {
      // Optional phone filter for customer orders
      const url = new URL(req.url);
      const phone = url.searchParams.get('phone');
      const rows = phone
        ? await sql`SELECT * FROM orders WHERE phone=${phone} ORDER BY created_at DESC`
        : await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      return new Response(JSON.stringify(rows), { headers });
    }

    if (req.method === 'POST') {
      const b = await req.json();
      const [row] = await sql`
        INSERT INTO orders (customer, phone, address, items, subtotal, delivery_fee, total, payment, status)
        VALUES (${b.customer}, ${b.phone}, ${b.address}, ${JSON.stringify(b.items)}, ${b.subtotal}, ${b.deliveryFee}, ${b.total}, ${b.payment}, 'pending')
        RETURNING *`;
      return new Response(JSON.stringify(row), { headers });
    }

    if (req.method === 'PUT') {
      const { id, status } = await req.json();
      const [row] = await sql`UPDATE orders SET status=${status} WHERE id=${id} RETURNING *`;
      return new Response(JSON.stringify(row), { headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/orders' };