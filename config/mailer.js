import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  const response = await resend.emails.send({
    from: process.env.MAIL_FROM, // ⚠️ FORCE THIS
    to,
    subject,
    html,
  });

  return response;
}