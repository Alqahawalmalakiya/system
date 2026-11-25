/** WhatsApp sharing for one-time customer card links. No automated sending. */
export function normalizeWhatsAppPhone(value) {
  const localized = String(value ?? '')
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0));
  let digits = localized.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Saudi mobile: 05xxxxxxxx or 5xxxxxxxx => +9665xxxxxxxx.
  if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  else if (/^5\d{8}$/.test(digits)) digits = `966${digits}`;
  // Don't silently route a malformed or local landline number to the wrong WhatsApp account.
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}

// Keep the prefilled WhatsApp text concise and entirely emoji-free.
// WhatsApp auto-detects the full HTTPS address placed on a dedicated line.
export function cardWelcomeMessage(name, cardLink, rewardThreshold = 6) {
  const customer = String(name ?? '')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0E\uFE0F\u200D\u20E3]/gu, '')
    .replace(/\s+/g, ' ').trim() || 'عميلنا العزيز';
  const threshold = Number.isInteger(Number(rewardThreshold)) && Number(rewardThreshold) > 0
    ? Number(rewardThreshold) : 6;
  return `السلام عليكم يا ${customer}
بطاقة الولاء الخاصة بك في القهوة الملكية جاهزة.

اضغط الرابط لتفتح بطاقتك مباشرة:
${cardLink}

بعد ${threshold} مناسبات تستحق هديتك.
لا تنس تثبيت البطاقة وتفعيل الإشعارات.`;
}

export function whatsappShareUrl({ name, cardLink, contact, rewardThreshold = 6 }) {
  const url = new URL(String(cardLink ?? ''));
  if (url.protocol !== 'https:') throw new Error('Card link must use HTTPS');
  const phone = normalizeWhatsAppPhone(contact);
  const message = cardWelcomeMessage(name, cardLink, rewardThreshold);
  return `https://wa.me/${phone ? phone : ''}?text=${encodeURIComponent(message)}`;
}
