import { Resend } from "resend";

export async function sendVerificationCode(email: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required in production");
    }
    console.info(`[bodh] verification code for ${email}: ${code}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "bodh <onboarding@resend.dev>",
    to: email,
    subject: "Your bodh. verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });
  if (error) throw new Error(error.message);
}
