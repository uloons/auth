export function buildEmail(opts: { title?: string; preheader?: string; bodyHtml: string }) {
  const { title = 'Uloons', preheader = '', bodyHtml } = opts;
  const logo = 'https://www.uloons.com/_next/image?url=%2Fmedia%2Fimg%2Flogo%2Flogo.png&w=384&q=75';
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
    <style>
      /* Simple, email-friendly styles */
      body { margin:0; padding:0; background:#f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
      .wrapper { width:100%; table-layout:fixed; background-color:#f4f6f8; padding: 24px 0; }
      .main { background:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06);} 
      .header { padding:20px 24px; text-align:center; background: linear-gradient(90deg,#ffffff,#fbfdff); }
      .logo { width:140px; height:auto; }
      .content { padding:24px; color:#0f1724; font-size:16px; line-height:1.5; }
      .btn { display:inline-block; padding:12px 20px; border-radius:8px; background:#0066ff; color:#fff; text-decoration:none; font-weight:600; }
      .muted { color:#64748b; font-size:13px; }
      .footer { padding:18px 24px; text-align:center; font-size:12px; color:#94a3b8; }
      .card { background: #fff; border-radius:8px; padding:16px; border:1px solid #eef2f7; }
      @media screen and (max-width:420px){ .content{padding:16px} .header{padding:16px} }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <center>
        <table class="main" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header">
              <img src="${logo}" alt="Uloons" class="logo" />
            </td>
          </tr>
          <tr>
            <td class="content">
              <div style="font-size:0; line-height:0; height:0; visibility:hidden; display:none">${preheader}</div>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <div class="muted">Uloons — Building delightful experiences</div>
              <div style="margin-top:8px;">By using Uloons you agree to our <a href="https://www.uloons.com/terms" style="color:#64748b; text-decoration:underline">Terms & Conditions</a> and <a href="https://www.uloons.com/privacy" style="color:#64748b; text-decoration:underline">Privacy Policy</a>.</div>
            </td>
          </tr>
        </table>
      </center>
    </div>
  </body>
  </html>`;
}
