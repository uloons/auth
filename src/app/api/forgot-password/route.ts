import { NextResponse } from 'next/server';
import { userPrisma } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier } = body;
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    // simple checks to decide whether identifier is email or phone
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;
    const phoneRegex = /^\d{10,}$/;

    let user = null;
    if (emailRegex.test(identifier)) {
      user = await userPrisma.user.findFirst({ where: { email: identifier } });
    } else if (phoneRegex.test(identifier)) {
      user = await userPrisma.user.findFirst({ where: { phone: identifier } });
    } else {
      return NextResponse.json({ error: 'Please provide a valid email or phone' }, { status: 400 });
    }

    // Always return a generic success message to avoid account enumeration.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // create password reset token and email user to set password
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await userPrisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt: expires }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/set-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Password reset request',
      html: passwordResetTemplate({ resetUrl, expiresIn: '1 hour', userName: user.name ?? undefined })
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
