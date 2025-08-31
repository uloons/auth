import { NextResponse } from 'next/server';
import { userPrisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const pr = await userPrisma.passwordResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    });

    if (!pr) return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 400 });

    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
