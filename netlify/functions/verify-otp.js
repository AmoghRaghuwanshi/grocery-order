import { neon } from '@netlify/neon';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const sql = neon();

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), { status: 400, headers });
  }

  const { phone, otp } = body;
  if (!phone || !otp) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing phone or OTP' }), { status: 400, headers });
  }

  // Normalize to last 10 digits — same as send-otp does
  const phoneNum = phone.replace(/\D/g, '').slice(-10);

  try {
    const rows = await sql`
      SELECT otp, expires_at FROM otp_sessions WHERE phone = ${phoneNum} LIMIT 1
    `;

    if (!rows.length) {
      return new Response(JSON.stringify({ ok: false, error: 'OTP not found. Please request a new one.' }), { headers });
    }

    const session = rows[0];

    // Check expiry
    if (new Date() > new Date(session.expires_at)) {
      await sql`DELETE FROM otp_sessions WHERE phone = ${phoneNum}`;
      return new Response(JSON.stringify({ ok: false, error: 'OTP expired. Please request a new one.' }), { headers });
    }

    // Check OTP match
    if (session.otp !== otp.toString().trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'Incorrect OTP. Try again.' }), { headers });
    }

    // ✅ Correct — delete and return success
    await sql`DELETE FROM otp_sessions WHERE phone = ${phoneNum}`;
    return new Response(JSON.stringify({ ok: true }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error: ' + e.message }), { status: 500, headers });
  }
};

export const config = { path: '/api/verify-otp' };