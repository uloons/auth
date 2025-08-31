import nodemailer from "nodemailer";

// Simple wrapper around nodemailer. Configure via env:
// EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE (true/false), EMAIL_USER, EMAIL_PASS, EMAIL_FROM

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  secure: process.env.EMAIL_SECURE === "true",
  auth: process.env.EMAIL_USER
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    : undefined,
});

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = "no-reply@uloons.com";
  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return info;
}
