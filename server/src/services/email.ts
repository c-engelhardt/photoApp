// Email delivery helpers for transactional notifications.
import sgMail from "@sendgrid/mail";
import { env } from "../config/env.js";

// Configure SendGrid once at module load.
sgMail.setApiKey(env.SENDGRID_API_KEY);

export const sendInviteEmail = async (to: string, token: string) => {
  // Invite links land in the frontend route that completes account setup.
  const inviteUrl = `${env.APP_URL}/invite/accept?token=${token}`;
  const subject = "You are invited to PhotoApp";
  const text = `You have been invited to view photos. Accept your invite here: ${inviteUrl}`;

  await sgMail.send({
    to,
    from: env.EMAIL_FROM,
    subject,
    text,
    html: `<p>You have been invited to view photos.</p><p><a href="${inviteUrl}">Accept your invite</a></p>`
  });
};
