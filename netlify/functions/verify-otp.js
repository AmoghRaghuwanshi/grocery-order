const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  let body;
  try { body = await req.json(); } catch(e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), { status: 400, headers });
  }

  const { otp } = body;

  if (otp && otp.toString().trim() === '111111') {
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ ok: false, error: 'Incorrect OTP. Use 111111' }), { headers });
};

export const config = { path: '/api/verify-otp' };