const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.RESEND_FROM_EMAIL ?? "Inco Trans <noreply@incotrans.rs>";

export async function sendReferralPromoEmail({
  to,
  name,
  promoCode,
  isReferrer
}: {
  to: string;
  name: string;
  promoCode: string;
  isReferrer: boolean;
}) {
  if (!apiKey || !to) return;

  const greeting = name ? `Zdravo ${name},` : "Zdravo,";
  const reason = isReferrer
    ? "Vaš prijatelj je potvrdio svoj broj telefona i time aktivirao referral nagradu."
    : "Uspešno ste potvrdili svoj broj telefona i aktivirali referral nagradu.";

  const subject = `Vaš Inco Trans promo kod: ${promoCode}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
      <h2 style="margin:0 0 16px">${subject}</h2>
      <p>${greeting}</p>
      <p>${reason}</p>
      <p>Vaš promo kod za <strong>5% popusta</strong> na sledeću vožnju:</p>
      <div style="margin:24px 0;padding:16px;background:#f5f0e6;border-radius:8px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:2px">
        ${promoCode}
      </div>
      <p style="font-size:13px;color:#666">Kod je jednokratan i vezan za vaš nalog. Unesite ga prilikom rezervacije.</p>
      <p style="margin-top:24px">Hvala na poverenju,<br/>Inco Trans tim</p>
    </div>
  `;
  const text = `${greeting}\n\n${reason}\n\nVaš promo kod za 5% popusta: ${promoCode}\n\nKod je jednokratan i vezan za vaš nalog.\n\nInco Trans tim`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html, text })
  }).catch((e) => console.error("Referral email send failed:", e));
}
