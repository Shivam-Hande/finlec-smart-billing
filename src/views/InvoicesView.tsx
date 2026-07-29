function ReminderModal({ invoice, onClose }: { invoice: InvoiceWithDetails; onClose: () => void }) {
  const totals = computeTotals(
    invoice.invoice_items?.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      tax_rate: Number(it.tax_rate),
    })) ?? [],
    Number(invoice.discount)
  );
  const status = deriveStatus(invoice);
  const daysOverdue =
    status === 'overdue' && invoice.due_date
      ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86400000)
      : 0;

  const [tone, setTone] = useState('friendly');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);

    const customerName = invoice.customer?.name ?? 'Customer';
    const amountStr = formatCurrency(totals.grandTotal);
    const invoiceNum = invoice.number ?? 'N/A';
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      if (!apiKey) {
        throw new Error('No Gemini API key found in VITE_GEMINI_API_KEY');
      }

      const prompt = `Write a payment reminder email for an invoice with the following details:
- Customer Name: ${customerName}
- Invoice Number: ${invoiceNum}
- Amount Due: ${amountStr}
- Due Date: ${invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
- Days Overdue: ${daysOverdue}
- Tone: ${tone}

Respond strictly in valid JSON format with no markdown formatting or backticks:
{"subject": "Your subject line here", "body": "Your email body text here"}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) throw new Error(`Gemini API error (${res.status})`);
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(rawText);
      setResult({ subject: parsed.subject, body: parsed.body });
    } catch (e) {
      console.warn('Gemini API request failed or missing key; using local template fallback.', e);

      // Fallback local generator if API key is invalid or request fails
      const templates: Record<string, { subject: string; body: string }> = {
        friendly: {
          subject: `Friendly reminder: Invoice ${invoiceNum} from Smart Billing`,
          body: `Hi ${customerName},\n\nHope you're having a great week! Just a friendly reminder regarding invoice ${invoiceNum} for ${amountStr}. Please let us know if you have any questions.\n\nBest regards,\nSmart Billing Team`,
        },
        firm: {
          subject: `Payment Reminder: Invoice ${invoiceNum}`,
          body: `Dear ${customerName},\n\nThis is a formal reminder regarding outstanding invoice ${invoiceNum} for ${amountStr}. Kindly process the payment at your earliest convenience.\n\nSincerely,\nAccounts Receivable`,
        },
        urgent: {
          subject: `URGENT: Overdue Payment Notice - Invoice ${invoiceNum}`,
          body: `URGENT NOTICE: Dear ${customerName},\n\nYour payment for invoice ${invoiceNum} in the amount of ${amountStr} is overdue. Please settle this amount immediately to ensure uninterrupted service.\n\nThank you,`,
        },
      };

      setResult(templates[tone] || templates.friendly);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open onClose={onClose} title="AI Payment Reminder" maxWidth="max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
          <Sparkles className="w-3 h-3" /> AI
        </span>
        <span className="text-sm text-slate-500">For invoice <span className="font-mono font-medium text-slate-700">{invoice.number}</span></span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Customer</p>
          <p className="font-medium text-slate-900 truncate">{invoice.customer?.name ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Amount</p>
          <p className="font-medium text-slate-900">{formatCurrency(totals.grandTotal)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Status</p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="mb-4">
        <Select label="Tone" value={tone} onChange={setTone}>
          <option value="friendly">Friendly</option>
          <option value="firm">Firm</option>
          <option value="urgent">Urgent</option>
        </Select>
      </div>

      <Button className="w-full" variant="success" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Generating…' : 'Generate reminder'}
      </Button>

      {error && (
        <p className="mt-3 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden animate-[slideUp_0.2s_ease]">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft message</span>
            <button
              onClick={copyToClipboard}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-4 text-sm">
            <p className="font-semibold text-slate-900 mb-2">{result.subject}</p>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{result.body}</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={copyToClipboard}>
              <Copy className="w-3.5 h-3.5" /> Copy text
            </Button>
            <a
              href={`mailto:${invoice.customer?.email ?? ''}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              <Send className="w-3.5 h-3.5" /> Email customer
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}