import { neon } from '@netlify/neon';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });

  const sql = neon();
  const { phone, otp } = await req.json();

  if (!phone || !otp) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing phone or OTP' }), { status: 400, headers });
  }

  try {
    // Get OTP from database
    const rows = await sql`
      SELECT otp, expires_at FROM otp_sessions
      WHERE phone = ${phone}
      LIMIT 1
    `;

    if (!rows.length) {
      return new Response(JSON.stringify({ ok: false, error: 'No OTP found. Please request a new one.' }), { headers });
    }

    const session = rows[0];

    // Check expiry
    if (new Date() > new Date(session.expires_at)) {
      await sql`DELETE FROM otp_sessions WHERE phone = ${phone}`;
      return new Response(JSON.stringify({ ok: false, error: 'OTP expired. Please request a new one.' }), { headers });
    }

    // Check OTP
    if (session.otp !== otp.toString()) {
      return new Response(JSON.stringify({ ok: false, error: 'Incorrect OTP' }), { headers });
    }

    // OTP correct — delete session
    await sql`DELETE FROM otp_sessions WHERE phone = ${phone}`;

    return new Response(JSON.stringify({ ok: true }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/verify-otp' };