export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  tax_rate: number;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  number: string;
  customer_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  discount: number;
  notes: string | null;
  created_at: string;
  grand_total?: number;
  subtotal?: number;
  tax_total?: number;
  customer?: Customer | null;
  invoice_items?: InvoiceItem[];
  items?: InvoiceItem[];
}

export interface InvoiceWithDetails extends Invoice {
  customer: Customer | null;
  invoice_items: InvoiceItem[];
}

export interface DraftItem {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
}

export function computeTotals(items: DraftItem[], discount: number): InvoiceTotals {
  const subtotal = items.reduce(
    (sum, it) => sum + it.unit_price * it.quantity,
    0
  );
  const taxAmount = items.reduce(
    (sum, it) => sum + it.unit_price * it.quantity * (it.tax_rate / 100),
    0
  );
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal + taxAmount);
  const grandTotal = Math.max(subtotal + taxAmount - safeDiscount, 0);
  return { subtotal, taxAmount, discount: safeDiscount, grandTotal };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${ymd}-${rand}`;
}

export function deriveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === 'paid') return 'paid';
  if (
    invoice.due_date &&
    new Date(invoice.due_date) < new Date(new Date().toDateString())
  ) {
    return 'overdue';
  }
  return invoice.status || 'unpaid';
}