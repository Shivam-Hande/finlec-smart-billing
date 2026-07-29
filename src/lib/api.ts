import { supabase } from '@/lib/supabase';
import type {
  Customer,
  Product,
  InvoiceWithDetails,
  DraftItem,
  InvoiceTotals,
} from '@/lib/types';
import { computeTotals } from '@/lib/types';

const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ==================== Customers ====================

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${baseUrl}/api/customers`, { headers: headers() });
  const body = await handle<{ data: Customer[] }>(res);
  return body.data ?? [];
}

export async function createCustomer(input: {
  name: string;
  email?: string;
  phone?: string;
}): Promise<Customer> {
  const res = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const body = await handle<{ data: Customer }>(res);
  return body.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/customers/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  await handle<{ success: boolean }>(res);
}

// ==================== Products ====================

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${baseUrl}/api/products`, { headers: headers() });
  const body = await handle<{ data: Product[] }>(res);
  return body.data ?? [];
}

export async function createProduct(input: {
  name: string;
  sku?: string;
  price: number;
  stock: number;
  tax_rate: number;
}): Promise<Product> {
  const res = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const body = await handle<{ data: Product }>(res);
  return body.data;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/products/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  await handle<{ success: boolean }>(res);
}

// ==================== Invoices ====================

export async function fetchInvoices(): Promise<InvoiceWithDetails[]> {
  const res = await fetch(`${baseUrl}/api/invoices`, { headers: headers() });
  const body = await handle<{ data: InvoiceWithDetails[] }>(res);
  return body.data ?? [];
}

export async function fetchInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
  const res = await fetch(`${baseUrl}/api/invoices/${id}`, { headers: headers() });
  if (res.status === 404) return null;
  const body = await handle<{ data: InvoiceWithDetails }>(res);
  return body.data;
}

export interface CreateInvoiceInput {
  customer_id: string;
  items: DraftItem[];
  discount: number;
  issue_date: string;
  due_date?: string;
  notes?: string;
  status?: string;
}

export interface CreateInvoiceResult {
  id: string;
  number: string;
  totals: InvoiceTotals;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  const res = await fetch(`${baseUrl}/api/invoices`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const body = await handle<{ data: { id: string; number: string }; totals: InvoiceTotals }>(res);
  return { id: body.data.id, number: body.data.number, totals: body.totals };
}

// ==================== AI Receipt OCR ====================

export interface ParsedReceipt {
  vendorName: string;
  items: { name: string; price: number; quantity: number }[];
  tax: number;
  total: number;
}

export async function parseReceipt(file: File): Promise<{ data: ParsedReceipt; source: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-receipt`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    let message = `Receipt parsing failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  const body = await res.json();
  if (!body?.data) throw new Error('Invalid response from receipt parser');
  return { data: body.data, source: body.source ?? 'mock' };
}

// Keep supabase import used (for direct status updates still done client-side)
export { supabase, computeTotals };
