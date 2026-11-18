/** Optional real email via EmailJS (https://www.emailjs.com — free tier).
 * 1. Create an EmailJS account
 * 2. Add an email service + template with variables: to_email, to_name, subject, message, verification_code
 * 3. Paste your IDs below
 * Leave blank to use demo mode (code shown in the app).
 */
export const EMAIL_CONFIG = {
  serviceId: '',
  templateId: '',
  publicKey: '',
};
if (typeof globalThis !== 'undefined') globalThis.EMAIL_CONFIG = EMAIL_CONFIG;
