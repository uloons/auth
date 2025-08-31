import { NextResponse } from 'next/server';
import { userPrisma } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';
import dns from 'dns/promises';

function randomFiveDigits() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function generateId(kind: 'INDIVIDUAL' | 'BUSINESS') {
  const year = new Date().getFullYear();
  const rand = randomFiveDigits();
  if (kind === 'INDIVIDUAL') return `IND${year}${rand}`;
  return `BSN${year}${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kind } = body;
    if (!kind || (kind !== 'INDIVIDUAL' && kind !== 'BUSINESS')) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    // basic validation
    if (kind === 'INDIVIDUAL') {
      const { name, email, phone } = body;
      if (!name || !email || !phone) {
        return NextResponse.json({ error: 'Missing fields for individual' }, { status: 400 });
      }

      // check uniqueness: phone and email
      const existingByPhone = await userPrisma.user.findFirst({ where: { phone } });
      if (existingByPhone) {
        return NextResponse.json({ error: 'Phone number already in use', code: 'PHONE_IN_USE' }, { status: 409 });
      }
      const existingByEmail = await userPrisma.user.findFirst({ where: { email } });
      if (existingByEmail) {
        // if email already verified, treat as taken
        if (existingByEmail.emailVerified) {
          return NextResponse.json({ error: 'Account with this email already exists', code: 'EMAIL_EXISTS' }, { status: 409 });
        }
        // email exists but not verified: instruct client to offer resend
        return NextResponse.json({ error: 'Email registered but password not set', code: 'EMAIL_UNVERIFIED' }, { status: 200 });
      }

      // quick email domain MX check
      try {
        const domain = email.split('@')[1];
        if (!domain) throw new Error('Invalid email');
        const mx = await dns.resolveMx(domain);
        if (!mx || mx.length === 0) {
          return NextResponse.json({ error: 'Email domain appears invalid or has no MX records' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Email domain appears invalid or has no MX records' }, { status: 400 });
      }
      const id = generateId(kind);
      const created = await userPrisma.user.create({
        data: { id, kind, name, email, phone }
      });

      // create password reset token and email user to set password
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      await userPrisma.passwordResetToken.create({
        data: { tokenHash, userId: created.id, expiresAt: expires }
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/set-password/${token}`;
      await sendEmail({
        to: email,
        subject: 'Complete your Uloons registration',
        html: passwordResetTemplate({ resetUrl, expiresIn: '1 hour', userName: name })
      });

      return NextResponse.json({ ok: true, user: created });
    }

    // business
    const { name, email, phone, gstin } = body;
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing fields for business' }, { status: 400 });
    }

    // check uniqueness: phone and email
    const existingByPhoneB = await userPrisma.user.findFirst({ where: { phone } });
    if (existingByPhoneB) {
      return NextResponse.json({ error: 'Phone number already in use', code: 'PHONE_IN_USE' }, { status: 409 });
    }
    const existingByEmailB = await userPrisma.user.findFirst({ where: { email } });
    if (existingByEmailB) {
      if (existingByEmailB.emailVerified) {
        return NextResponse.json({ error: 'Account with this email already exists', code: 'EMAIL_EXISTS' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email registered but password not set', code: 'EMAIL_UNVERIFIED' }, { status: 200 });
    }
    // quick email domain MX check
    try {
      const domain = email.split('@')[1];
      if (!domain) throw new Error('Invalid email');
      const mx = await dns.resolveMx(domain);
      if (!mx || mx.length === 0) {
        return NextResponse.json({ error: 'Email domain appears invalid or has no MX records' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Email domain appears invalid or has no MX records' }, { status: 400 });
    }
    const id = generateId(kind);
    const created = await userPrisma.user.create({
      data: { id, kind, name, email, phone, gstin }
    });
    // create password reset token and email user to set password
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await userPrisma.passwordResetToken.create({
      data: { tokenHash, userId: created.id, expiresAt: expires }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/set-password/${token}`;
    await sendEmail({
      to: email,
      subject: 'Complete your Uloons registration',
      html: passwordResetTemplate({ resetUrl, expiresIn: '1 hour', userName: name })
    });

    return NextResponse.json({ ok: true, user: created });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
