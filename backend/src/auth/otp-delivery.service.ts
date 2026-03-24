import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import twilio from 'twilio';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  async sendRegistrationOtp(
    email: string,
    phone: string | undefined,
    code: string,
  ): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (sid && token && from && phone?.trim()) {
      try {
        const client = twilio(sid, token);
        await client.messages.create({
          body: `Construction Connect verification code: ${code}`,
          from,
          to: phone.trim(),
        });
        this.logger.log(`OTP SMS sent to ${phone}`);
        return;
      } catch (e) {
        this.logger.warn(`Twilio SMS failed, falling back to email: ${e}`);
      }
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: user,
        to: email,
        subject: 'Your Construction Connect verification code',
        text: `Your verification code is: ${code}\n\nIt expires in 10 minutes.`,
      });
      this.logger.log(`OTP email sent to ${email}`);
      return;
    }

    this.logger.warn(
      `[dev] OTP for ${email}: ${code} (configure SMTP or Twilio to deliver)`,
    );
  }
}
