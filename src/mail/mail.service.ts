import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('mail.resendApiKey');
    this.fromAddress =
      this.config.get<string>('mail.from') ||
      'Journey Admin <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email client initialized successfully.');
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set. Outgoing emails will be logged to console only.',
      );
    }
  }

  /**
   * Send password reset email via Resend
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetLink: string,
  ): Promise<{ id?: string; simulated?: boolean }> {
    const subject = 'Reset your password - Journey Admin Console';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                Journey Education CMS
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">
                Management Console
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${name || 'Admin'}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                We received a request to reset your password for your Journey Admin account. Click the button below to set a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                This link will expire in <strong>15 minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you did not request a password reset, you can safely ignore this email. Your account remains secure.
              </p>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 20px 0;" />

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5; word-break: break-all;">
                Having trouble clicking the button? Copy and paste this URL into your browser:<br />
                <a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Journey Education Co., Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (!this.resend) {
      this.logger.warn(
        `[SIMULATED EMAIL] To: ${to} | Subject: ${subject} | Link: ${resetLink}`,
      );
      return { simulated: true };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromAddress,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (response.error) {
        this.logger.error(
          `Resend API error sending to ${to}: ${response.error.message}`,
        );
        throw new Error(response.error.message);
      }

      this.logger.log(
        `Reset password email sent successfully to ${to} (Message ID: ${response.data?.id})`,
      );
      return { id: response.data?.id };
    } catch (err) {
      this.logger.error(`Failed to send email via Resend to ${to}`, err);
      throw err;
    }
  }
}
