/**
 * Mailer générique (Resend).
 *
 * scout fournit uniquement l'envoi bas-niveau `sendEmail` ; le branding et les
 * templates (layout HTML, boutons, invitations) restent côté mission.
 *
 * Injection : clé API + adresse `from` passées via {@link makeMailer}.
 */

export interface MailerConfig {
  apiKey: string;
  /** Adresse expéditeur, ex `Acme <hello@acme.tld>`. */
  from: string;
}

export function makeMailer(config: MailerConfig) {
  async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!config.apiKey) throw new Error("RESEND_API_KEY not configured");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error ${res.status}: ${text}`);
    }
  }

  return { sendEmail };
}
