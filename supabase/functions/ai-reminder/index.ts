import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TONES = ["friendly", "firm", "urgent"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const customerName = String(body?.customerName ?? "there");
    const invoiceNumber = String(body?.invoiceNumber ?? "INV-0000");
    const amount = Number(body?.amount ?? 0);
    const dueDate = String(body?.dueDate ?? "");
    const daysOverdue = Number(body?.daysOverdue ?? 0);
    const tone = TONES.includes(String(body?.tone)) ? String(body?.tone) : "friendly";

    const amountStr = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    const reminders = {
      friendly: `Hi ${customerName},\n\nJust a friendly reminder that invoice ${invoiceNumber} for ${amountStr}${dueDate ? ` was due on ${dueDate}` : " is now due"}. We'd appreciate it whenever you're able to send payment. If you have any questions, just reply to this email.\n\nThanks so much,\nThe Billing Team`,
      firm: `Dear ${customerName},\n\nThis is a formal reminder that invoice ${invoiceNumber} for ${amountStr}${dueDate ? ` was due on ${dueDate}` : " is now due"} and remains unpaid. Please arrange payment at your earliest convenience to avoid any disruption to your account.\n\nRegards,\nBilling Department`,
      urgent: `ATTENTION ${customerName.toUpperCase()},\n\nInvoice ${invoiceNumber} for ${amountStr}${daysOverdue > 0 ? ` is now ${daysOverdue} day(s) overdue` : dueDate ? ` was due on ${dueDate}` : " is now due"}. Immediate payment is required to prevent further action and potential late fees. Please process payment within 48 hours and confirm receipt.\n\nBilling Department`,
    };

    const subject =
      tone === "urgent"
        ? `URGENT: Invoice ${invoiceNumber} overdue — action required`
        : tone === "firm"
        ? `Payment reminder: Invoice ${invoiceNumber}`
        : `Friendly reminder: Invoice ${invoiceNumber}`;

    return new Response(
      JSON.stringify({
        subject,
        body: reminders[tone as keyof typeof reminders],
        tone,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to generate reminder" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
