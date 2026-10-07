import { Resend } from "resend";
import { getEnv } from "@/config/env";

export async function sendVerificationCode(email: string, code: string) {
  const resendApiKey = getEnv("RESEND_API_KEY");

  if (!resendApiKey) {
    console.info(`[bodh] verification code for ${email}: ${code}`);
    return;
  }

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: getEnv("RESEND_FROM_EMAIL") || "bodh <onboarding@resend.dev>",
    to: email,
    subject: "Your bodh. verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });
  if (error) throw new Error(error.message);
}
