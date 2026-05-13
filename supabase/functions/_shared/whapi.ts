/**
 * Shared Whapi helper — send a text message via Whapi.cloud
 */
export async function sendWhapiMessage(
  token: string,
  to: string,
  text: string
): Promise<boolean> {
  // Normalize phone: remove + and non-digits, append @s.whatsapp.net
  const phone = to.replace(/\D/g, "");
  const chatId = `${phone}@s.whatsapp.net`;

  const res = await fetch("https://gate.whapi.cloud/messages/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: chatId, body: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[whapi] send failed:", res.status, err);
    return false;
  }
  return true;
}
