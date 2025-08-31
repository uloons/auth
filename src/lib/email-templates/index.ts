import { buildEmail } from './base';

// Function to format date in "1st March, 2025" format
function formatDateWithOrdinal(dateString: string): string {
  const date = new Date(dateString);
  
  // Get day with ordinal suffix
  const day = date.getUTCDate();
  const ordinalSuffix = getOrdinalSuffix(day);
  
  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[date.getUTCMonth()];
  
  // Get year
  const year = date.getUTCFullYear();
  
  return `${day}${ordinalSuffix} ${monthName}, ${year}`;
}

// Function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function passwordResetTemplate(opts: { resetUrl: string; expiresIn?: string; userName?: string }) {
  const { resetUrl, expiresIn = '1 hour', userName } = opts;
  const nameLine = userName ? `<p style="margin:0 0 8px 0; font-weight:600">Hi ${escapeHtml(userName)},</p>` : '';
  const body = `
    ${nameLine}
    <div class="card">
      <h2 style="margin:0 0 8px 0; font-size:20px; color:#0f1724">Set your Uloons password</h2>
      <p style="margin:0 0 16px 0;" class="muted">Click the button below to set a password and complete your registration.</p>
      <p style="text-align:center; margin:18px 0"><a href="${resetUrl}" class="btn">Set password</a></p>
      <p class="muted" style="margin:8px 0 0 0">Or paste this link in your browser:<br/><a href="${resetUrl}" style="color:#374151; word-break:break-all">${resetUrl}</a></p>
      <p class="muted" style="margin-top:12px">This link will expire in ${escapeHtml(expiresIn)}.</p>
    </div>
  `;
  return buildEmail({ title: 'Set your Uloons password', preheader: 'Set your password to access your Uloons account', bodyHtml: body });
}

export function passwordChangedNotification(opts: { userEmail: string; deviceInfoHtml?: string }) {
  const body = `
    <div class="card">
      <h2 style="margin:0 0 8px 0; font-size:20px; color:#0f1724">Your Uloons password was changed</h2>
      <p style="margin:0 0 12px 0;" class="muted">A password was recently set for the account ${escapeHtml(opts.userEmail)}. If this was you, no action is needed.</p>
      ${opts.deviceInfoHtml ?? ''}
      <p class="muted" style="margin-top:12px">If you did not make this change, please contact support immediately.</p>
    </div>
  `;
  return buildEmail({ title: 'Password changed — Uloons', preheader: 'Your Uloons password was changed', bodyHtml: body });
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function loginNotification(opts: { userEmail: string; when: string; deviceInfoHtml?: string }) {
  const formattedDate = formatDateWithOrdinal(opts.when);
  const body = `
    <div class="card">
      <h2 style="margin:0 0 8px 0; font-size:20px; color:#0f1724">New sign-in to your Uloons account</h2>
      <p style="margin:0 0 12px 0;" class="muted">A new sign-in was detected for the account ${escapeHtml(opts.userEmail)} on ${escapeHtml(formattedDate)} (Global Standard Time - Your local time might be different).</p>
      ${opts.deviceInfoHtml ?? ''}
      <p class="muted" style="margin-top:12px">If this was you, you can safely ignore this message. If not, please reset your password immediately or contact support.</p>
    </div>
  `;
  return buildEmail({ title: 'New sign-in — Uloons', preheader: 'New sign-in to your Uloons account', bodyHtml: body });
}
