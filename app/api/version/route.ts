import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    'local';

  const ref =
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.GIT_COMMIT_REF ||
    '';

  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || '';
  const url = process.env.VERCEL_URL || '';

  return NextResponse.json(
    {
      sha,
      shortSha: sha === 'local' ? 'local' : sha.slice(0, 7),
      ref,
      deploymentId,
      url,
      at: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

