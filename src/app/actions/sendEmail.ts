"use server";

import nodemailer from "nodemailer";

const MAIL_USER = process.env.SMTP_USER ?? "info@octabitlogics.com";
const MAIL_PASS = process.env.SMTP_PASS ?? "";
const MAIL_TO = process.env.MAIL_TO ?? "info@sporttek.pk";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

export type QueryFormData = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendEmail(formData: QueryFormData) {
  const name = formData.name?.trim() ?? "";
  const email = formData.email?.trim() ?? "";
  const phone = formData.phone?.trim();
  const role = formData.role?.trim();
  const message = formData.message?.trim() ?? "";

  if (!name || !email || !message) {
    return { success: false, error: "Please fill out name, email, and message." };
  }

  if (!MAIL_PASS) {
    return { success: false, error: "Mail is not configured on this server." };
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = phone ? escapeHtml(phone) : "";
  const safeRole = role ? escapeHtml(role) : "";
  const safeMessage = escapeHtml(message);

  try {
    await transporter.sendMail({
      from: `"SportTek" <${MAIL_USER}>`,
      to: MAIL_TO,
      replyTo: `"${name.replace(/["\r\n]/g, "")}" <${email}>`,
      subject: `[SportTek] Query from ${name}`,
      text: `New SportTek query\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}${role ? `\nI am a: ${role}` : ""}\n\nMessage:\n${message}`,
      html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0f1c28;">
  <div style="background: linear-gradient(135deg, #071018 0%, #17354f 100%); padding: 28px 32px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #d4e22a; font-size: 20px; margin: 0 0 4px 0; font-weight: 700;">New SportTek query</h1>
    <p style="color: rgba(247,248,250,0.65); font-size: 13px; margin: 0;">sporttek.pk · contact form</p>
  </div>
  <div style="background: #f7f8fa; padding: 28px 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr><td style="padding: 8px 0; font-size: 13px; color: #5b6b78; width: 110px;">Name</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #0f1c28;">${safeName}</td></tr>
      <tr><td style="padding: 8px 0; font-size: 13px; color: #5b6b78;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${safeEmail}" style="color: #65aa2b;">${safeEmail}</a></td></tr>
      ${safePhone ? `<tr><td style="padding: 8px 0; font-size: 13px; color: #5b6b78;">Phone</td><td style="padding: 8px 0; font-size: 14px; color: #0f1c28;">${safePhone}</td></tr>` : ""}
      ${safeRole ? `<tr><td style="padding: 8px 0; font-size: 13px; color: #5b6b78;">I am a</td><td style="padding: 8px 0; font-size: 14px; color: #0f1c28;">${safeRole}</td></tr>` : ""}
    </table>
    <div style="background: #ffffff; border-left: 4px solid #d4e22a; border-radius: 4px; padding: 16px 20px;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5b6b78; margin: 0 0 10px 0;">Message</p>
      <p style="font-size: 14px; line-height: 1.7; color: #0f1c28; white-space: pre-wrap; margin: 0;">${safeMessage}</p>
    </div>
    <p style="font-size: 11px; color: #9aa4ad; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Sent from the SportTek launching-soon page. Reply to reach ${safeName}.
    </p>
  </div>
</div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("sendEmail error:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}
