import { NextResponse } from 'next/server';
import { userPrisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { passwordChangedNotification } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const token = body?.token;
  const password = body?.password;
  const deviceInfo = body?.deviceInfo ?? null;
  if (!token || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const pr = await userPrisma.passwordResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!pr) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);

    await userPrisma.user.update({ where: { id: pr.userId }, data: { password: hashed, emailVerified: true } });
    await userPrisma.passwordResetToken.update({ where: { id: pr.id }, data: { used: true } });

    // send notification email including device info (best-effort)
      try {
        let deviceHtml = '';
        if (deviceInfo) {
          const parts: string[] = [];
          if (deviceInfo.deviceName) parts.push(`<li><strong>Device</strong>: ${escapeHtml(deviceInfo.deviceName)}</li>`);
          if (deviceInfo.browserName) parts.push(`<li><strong>Browser</strong>: ${escapeHtml(deviceInfo.browserName)}</li>`);
          if (deviceInfo.ip) parts.push(`<li><strong>IP</strong>: ${escapeHtml(deviceInfo.ip)}</li>`);
          if (deviceInfo.location) {
            const loc = deviceInfo.location;
            const placeParts: string[] = [];
            if (loc.city) placeParts.push(escapeHtml(loc.city));
            if (loc.region) placeParts.push(escapeHtml(loc.region));
            if (loc.country) placeParts.push(escapeHtml(loc.country));
            const place = placeParts.length ? placeParts.join(', ') : '';
            const coords = (loc.lat != null && loc.lon != null) ? `(${escapeHtml(String(loc.lat))}, ${escapeHtml(String(loc.lon))})` : '';
            const locationText = place || coords || 'Unknown';
            parts.push(`<li><strong>Location</strong>: ${locationText}</li>`);
          }
          if (deviceInfo.userAgent) parts.push(`<li><strong>User Agent</strong>: ${escapeHtml(deviceInfo.userAgent)}</li>`);
          deviceHtml = `<h4 style="margin:12px 0 6px 0">Device & location details</h4><ul style="margin:0 0 0 16px;">${parts.join('')}</ul>`;
        }
        await sendEmail({ to: pr.user.email, subject: 'New password set for your Uloons account', html: passwordChangedNotification({ userEmail: pr.user.email, deviceInfoHtml: deviceHtml }) });
      } catch (err) {
        console.error('Failed to send password-change email', err);
      }

      function escapeHtml(s: string) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
