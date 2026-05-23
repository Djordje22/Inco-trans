const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.RESEND_FROM_EMAIL ?? "Inco Trans <noreply@incotrans.rs>";

export async function sendLoyaltyCodeEmail({
  to,
  promoCode,
  milestone
}: {
  to: string;
  promoCode: string;
  milestone: number;
}) {
  if (!apiKey || !to) return;

  const subject = `Čestitamo! Vaš besplatan transfer – ${promoCode}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
      <h2 style="margin:0 0 16px">${subject}</h2>
      <p>Čestitamo!</p>
      <p>Upravo ste završili svoju <strong>${milestone}. vožnju</strong> sa Inco Trans.</p>
      <p>Kao nagradu dobijate <strong>besplatan transfer do 25km</strong> za aerodromski servis ili duge relacije:</p>
      <div style="margin:24px 0;padding:16px;background:#f5f0e6;border-radius:8px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:2px">
        ${promoCode}
      </div>
      <p style="font-size:13px;color:#666">Kod je jednokratan i vezan za vaš nalog. Unesite ga prilikom rezervacije. Važi za aerodromski servis i duge relacije. Za distance preko 25km, naplaćuje se 1,15 €/km za dodatnu kilometražu. Čekanje i drugi dodaci ostaju naplativi.</p>
      <p style="margin-top:24px">Hvala na poverenju,<br/>Inco Trans tim</p>
    </div>
  `;
  const text = `Čestitamo! Završili ste svoju ${milestone}. vožnju sa Inco Trans.\n\nVaš loyalty kod za besplatan transfer do 25km: ${promoCode}\n\nKod je jednokratan i vezan za vaš nalog. Važi za aerodromski servis i duge relacije.\n\nInco Trans tim`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html, text })
  }).catch((e) => console.error("Loyalty email send failed:", e));
}
