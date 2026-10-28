import { NextResponse } from 'next/server';

// S6: the /api/mobile/* APIs are bearer-token authenticated and the native app sends no Origin
// header (CORS doesn't apply to it), so `*` is safe by default. Set MOBILE_API_CORS_ORIGIN (e.g.
// https://app.example.com) to lock browser access down to a single web origin once one exists.
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.MOBILE_API_CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function corsResponse(body: any, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init?.headers,
      ...corsHeaders,
    },
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
