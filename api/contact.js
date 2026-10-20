
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, service, description } = req.body || {};

    const fields = [name, email, phone, service, description];

    if (
      fields.some(
        (v) => typeof v !== "string" || !v.trim()
      )
    ) {
      return res.status(400).json({
        error: "Please complete all inquiry fields.",
      });
    }

    if (
      name.length > 120 ||
      email.length > 254 ||
      phone.length > 30 ||
      service.length > 100 ||
      description.length > 5000
    ) {
      return res.status(400).json({
        error: "One or more fields are too long.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_TO || "info@tickers.online";

    if (!apiKey || !from) {
      console.error("Missing Resend environment variables");
      return res.status(503).json({
        error: "Email delivery is not configured.",
      });
    }

    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email.trim(),
        subject: `Website inquiry: ${service.trim()}`,
        text: [
          "New project inquiry from TICKER'S ONLINE",
          "",
          `Name: ${name.trim()}`,
          `Email: ${email.trim()}`,
          `Phone: ${phone.trim()}`,
          `Service: ${service.trim()}`,
          "",
          "Project description:",
          description.trim(),
        ].join("\n"),
      }),
    });

    const responseBody = await result.json().catch(() => ({}));

    if (!result.ok) {
      console.error("Resend API error:", result.status, responseBody);
      return res.status(502).json({
        error: "Email delivery failed. Please try again.",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact API failed:", error);
    return res.status(500).json({
      error: "An unexpected error occurred.",
    });
  }
}
