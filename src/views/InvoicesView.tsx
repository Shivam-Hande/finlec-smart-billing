import { useMemo, useState } from 'react';
import {
  ReceiptText,
  Eye,
  Printer,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  Modal,
  StatusBadge,
  EmptyState,
  Select,
} from '@/components/ui';
import { useInvoices } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import {
  computeTotals,
  formatCurrency,
  formatDate,
  deriveStatus,
  type InvoiceWithDetails,
} from '@/lib/types';

export function InvoicesView() {
  const { invoices, loading, reload } = useInvoices();
  const [preview, setPreview] = useState<InvoiceWithDetails | null>(null);
  const [reminderFor, setReminderFor] = useState<InvoiceWithDetails | null>(null);

  const stats = useMemo(() => {
    let paid = 0,
      unpaid = 0,
      overdue = 0;
    invoices.forEach((i) => {
      const s = deriveStatus(i);
      if (s === 'paid') paid++;
      else if (s === 'overdue') overdue++;
      else unpaid++;
    });
    return { paid, unpaid, overdue };
  }, [invoices]);

  async function markStatus(inv: InvoiceWithDetails, status: 'paid' | 'unpaid' | 'overdue') {
    await supabase.from('invoices').update({ status }).eq('id', inv.id);
    reload();
    setPreview(null);
  }

  function getGrandTotal(inv: InvoiceWithDetails): number {
    if (inv.grand_total && Number(inv.grand_total) > 0) {
      return Number(inv.grand_total);
    }
    const rawItems = inv.items || inv.invoice_items || [];
    return computeTotals(
      rawItems.map((it) => ({
        product_id: it.product_id,
        name: it.product?.name || it.name || 'Item',
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        tax_rate: Number(it.product?.tax_rate || 0),
      })),
      Number(inv.discount || 0)
    ).grandTotal;
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total · ${stats.paid} paid · ${stats.unpaid} unpaid · ${stats.overdue} overdue`}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="w-7 h-7" />}
            title="No invoices yet"
            subtitle="Create your first invoice from the New Invoice tab"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Issued</th>
                  <th className="px-6 py-3">Due</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const grandTotal = getGrandTotal(inv);
                  const status = deriveStatus(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-3.5 font-mono text-xs font-medium text-slate-900">
                        {inv.number || inv.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">{inv.customer?.name ?? '—'}</td>
                      <td className="px-6 py-3.5 text-slate-500">{formatDate(inv.issue_date)}</td>
                      <td className="px-6 py-3.5 text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(grandTotal)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreview(inv)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReminderFor(inv)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="AI reminder"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {preview && (
        <InvoicePreview
          invoice={preview}
          onClose={() => setPreview(null)}
          onMarkStatus={(s) => markStatus(preview, s)}
        />
      )}

      {reminderFor && (
        <ReminderModal invoice={reminderFor} onClose={() => setReminderFor(null)} />
      )}
    </div>
  );
}

function InvoicePreview({
  invoice,
  onClose,
  onMarkStatus,
}: {
  invoice: InvoiceWithDetails;
  onClose: () => void;
  onMarkStatus: (s: 'paid' | 'unpaid' | 'overdue') => void;
}) {
  const items = invoice.items || invoice.invoice_items || [];
  const totals = computeTotals(
    items.map((it) => ({
      product_id: it.product_id,
      name: it.product?.name || it.name || 'Item',
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      tax_rate: Number(it.product?.tax_rate || 0),
    })),
    Number(invoice.discount || 0)
  );
  const status = deriveStatus(invoice);

  return (
    <Modal open onClose={onClose} title="Invoice preview" maxWidth="max-w-3xl">
      <div className="print-area">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-900">Smart Billing</span>
            </div>
            <p className="text-xs text-slate-400">123 Business Ave, Suite 100</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">INVOICE</h2>
            <p className="text-sm font-mono text-slate-500 mt-1">{invoice.number || invoice.id.slice(0, 8)}</p>
            <div className="mt-2"><StatusBadge status={status} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-semibold text-slate-900">{invoice.customer?.name ?? '—'}</p>
            {invoice.customer?.email && <p className="text-slate-500">{invoice.customer.email}</p>}
            {invoice.customer?.phone && <p className="text-slate-500">{invoice.customer.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dates</p>
            <p className="text-slate-700">Issued: <span className="font-medium">{formatDate(invoice.issue_date)}</span></p>
            <p className="text-slate-700">Due: <span className="font-medium">{formatDate(invoice.due_date)}</span></p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="py-3 font-medium text-slate-900">{it.product?.name || it.name || 'Item'}</td>
                <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                <td className="py-3 text-right text-slate-600">{formatCurrency(Number(it.unit_price))}</td>
                <td className="py-3 text-right text-slate-600">{Number(it.product?.tax_rate || 0)}%</td>
                <td className="py-3 text-right font-medium text-slate-900">
                  {formatCurrency(Number(it.unit_price) * it.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal || totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{formatCurrency(invoice.tax_total || totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discount || totals.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-base">
              <span>Total</span>
              <span>{formatCurrency(invoice.grand_total || totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Mark as:</span>
          <Button size="sm" variant="success" onClick={() => onMarkStatus('paid')}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onMarkStatus('unpaid')}>
            <Clock className="w-3.5 h-3.5" /> Unpaid
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onMarkStatus('overdue')}>
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
          </Button>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>
    </Modal>
  );
}

function ReminderModal({ invoice, onClose }: { invoice: InvoiceWithDetails; onClose: () => void }) {
  const items = invoice.items || invoice.invoice_items || [];
  const totals = computeTotals(
    items.map((it) => ({
      product_id: it.product_id,
      name: it.product?.name || it.name || 'Item',
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      tax_rate: Number(it.product?.tax_rate || 0),
    })),
    Number(invoice.discount || 0)
  );
  const grandTotal = Number(invoice.grand_total) || totals.grandTotal;
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
    const amountStr = formatCurrency(grandTotal);
    const invoiceNum = invoice.number ?? invoice.id.slice(0, 8);
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
        <span className="text-sm text-slate-500">
          For invoice <span className="font-mono font-medium text-slate-700">{invoice.number || invoice.id.slice(0, 8)}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Customer</p>
          <p className="font-medium text-slate-900 truncate">{invoice.customer?.name ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Amount</p>
          <p className="font-medium text-slate-900">{formatCurrency(grandTotal)}</p>
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