import { useMemo, useRef, useState } from 'react';
import {
  Trash2,
  ScanLine,
  Loader2,
  Save,
  Sparkles,
  Package,
  ImageIcon,
  Check,
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  Input,
  Select,
  EmptyState,
} from '@/components/ui';
import { useCustomers, useProducts, useInvoices } from '@/lib/hooks';
import { createInvoice, parseReceipt, type ParsedReceipt } from '@/lib/api';
import {
  computeTotals,
  formatCurrency,
  type DraftItem,
  type InvoiceWithDetails,
} from '@/lib/types';

export function InvoiceBuilder({ onSaved }: { onSaved: () => void }) {
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { add: addInvoice } = useInvoices();

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSource, setParseSource] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(
    () => computeTotals(items, Number(discount) || 0),
    [items, discount]
  );

  function addProductLine(productId: string) {
    if (!productId) return;
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        quantity: 1,
        unit_price: Number(p.price),
        tax_rate: Number(p.tax_rate),
      },
    ]);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function swapProduct(index: number, productId: string) {
    if (!productId) {
      updateItem(index, { product_id: null });
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateItem(index, {
      product_id: p.id,
      name: p.name,
      unit_price: Number(p.price),
      tax_rate: Number(p.tax_rate),
    });
  }

  async function handleReceiptUpload(file: File) {
    setParsing(true);
    setParseError(null);
    setParseSource(null);
    try {
      const { data, source } = await parseReceipt(file);
      setParseSource(source);
      applyParsedReceipt(data);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Could not parse that receipt.');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function applyParsedReceipt(receipt: ParsedReceipt) {
    if (!receipt.items || receipt.items.length === 0) {
      setParseError('No line items detected on this receipt.');
      return;
    }

    // Try auto-matching customer if detected on receipt
    if (receipt.vendor) {
      const matchedCustomer = customers.find(
        (c) => c.name.toLowerCase().includes(receipt.vendor!.toLowerCase())
      );
      if (matchedCustomer) setCustomerId(matchedCustomer.id);
    }

    setItems((prev) => {
      const merged = [...prev];
      receipt.items.forEach((parsed) => {
        const match = products.find(
          (p) => p.name.toLowerCase() === parsed.name.toLowerCase()
        );
        const existingIdx = merged.findIndex(
          (it) => it.name.toLowerCase() === parsed.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            quantity: merged[existingIdx].quantity + (parsed.quantity || 1),
          };
        } else {
          merged.push({
            product_id: match?.id ?? null,
            name: parsed.name || 'Receipt Item',
            quantity: Math.max(1, parsed.quantity || 1),
            unit_price: match ? Number(match.price) : Number(parsed.price) || 0,
            tax_rate: match ? Number(match.tax_rate) : 0,
          });
        }
      });
      return merged;
    });

    if (receipt.total > 0) {
      const computedSubtotal = receipt.items.reduce(
        (s, it) => s + (it.price || 0) * (it.quantity || 1),
        0
      );
      if (receipt.total < computedSubtotal && (!discount || discount === '0')) {
        setDiscount((computedSubtotal - receipt.total).toFixed(2));
      }
    }
  }

  async function save() {
    if (!customerId || items.length === 0) return;
    setSaving(true);
    setSaveError(null);

    const customerObj = customers.find((c) => c.id === customerId);

    const localInvoice: InvoiceWithDetails = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      customer: customerObj ?? null,
      issue_date: issueDate,
      due_date: dueDate || new Date().toISOString().slice(0, 10),
      status: 'unpaid',
      subtotal: totals.subtotal,
      tax_total: totals.taxAmount,
      grand_total: totals.grandTotal,
      discount: Number(discount) || 0,
      notes: notes.trim() || undefined,
      items: items.map((it) => {
        const prod = products.find((p) => p.id === it.product_id);
        return {
          id: crypto.randomUUID(),
          invoice_id: '',
          product_id: it.product_id ?? '',
          product: prod,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
          amount: it.quantity * it.unit_price,
        };
      }),
      invoice_items: [],
      created_at: new Date().toISOString(),
    };

    // 1. Save locally
    await addInvoice(localInvoice);

    // 2. Optional backend sync
    try {
      await createInvoice({
        customer_id: customerId,
        items,
        discount: Number(discount) || 0,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
        status: 'unpaid',
      });
    } catch (e) {
      console.warn('Backend server unreached; saved invoice locally.');
    } finally {
      setSaving(false);
      onSaved();
    }
  }

  const canSave = customerId && items.length > 0 && !saving;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="New Invoice"
        subtitle="Build a smart invoice with live totals"
      />

      {/* AI receipt upload */}
      <Card className="p-5 mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              Upload Receipt to Auto-fill
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload an image or PDF of a receipt — AI Vision extracts vendor, items, and totals to pre-fill the form.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleReceiptUpload(f);
            }}
          />
          <Button variant="success" onClick={() => fileRef.current?.click()} disabled={parsing}>
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {parsing ? 'Scanning…' : 'Upload receipt'}
          </Button>
        </div>
        {parseSource && !parseError && (
          <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Receipt parsed{parseSource === 'mock' ? ' (demo data — add a Gemini API key for live OCR)' : ' via Gemini Vision'}.
          </p>
        )}
        {parseError && (
          <p className="mt-3 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{parseError}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Invoice details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Customer" value={customerId} onChange={setCustomerId}>
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Issue date" type="date" value={issueDate} onChange={setIssueDate} />
                <Input label="Due date" type="date" value={dueDate} onChange={setDueDate} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Line items</h2>
              {products.length > 0 && (
                <Select value="" onChange={(v) => v && addProductLine(v)} className="w-48">
                  <option value="">+ Add product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              )}
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={<Package className="w-7 h-7" />}
                title="No items yet"
                subtitle="Add products from the dropdown or upload a receipt"
              />
            ) : (
              <div className="space-y-3">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => updateItem(i, { name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                        placeholder="Item Name"
                      />
                      {products.length > 0 && (
                        <select
                          value={it.product_id ?? ''}
                          onChange={(e) => swapProduct(i, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-200 bg-slate-100 text-xs text-slate-500 focus:outline-none"
                        >
                          <option value="">Custom / Receipt Item</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={it.unit_price}
                        onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) || 0 })}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(it.unit_price * it.quantity)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(i)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank-you note, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition resize-none"
            />
          </Card>
        </div>

        {/* Right: summary */}
        <div>
          <Card className="p-6 sticky top-6">
            <h2 className="font-semibold text-slate-900 mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
              <Row label="Tax" value={formatCurrency(totals.taxAmount)} />
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 bg-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Grand Total</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            <Button className="w-full mt-6" size="lg" onClick={save} disabled={!canSave}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save invoice'}
            </Button>
            {saveError && (
              <p className="text-xs text-rose-600 mt-2 text-center">{saveError}</p>
            )}
            {!customerId && (
              <p className="text-xs text-slate-400 mt-2 text-center">Select a customer to save</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
  void ImageIcon;
}