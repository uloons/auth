import { NextResponse } from 'next/server';
import { userPrisma } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  // find user by email
  const user = await userPrisma.user.findFirst({ where: { email } });
    if (!user) {
      // Return 200 to avoid leaking whether an email exists; client shows a generic message.
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
      to: email,
      subject: 'Uloons — Your password set link (resend)',
      html: passwordResetTemplate({ resetUrl, expiresIn: '1 hour' })
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
