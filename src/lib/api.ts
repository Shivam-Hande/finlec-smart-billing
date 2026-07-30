import { supabase } from '@/lib/supabase';
import type {
  Customer,
  Product,
  InvoiceWithDetails,
  DraftItem,
  InvoiceTotals,
} from '@/lib/types';
import { computeTotals } from '@/lib/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const hasSupabase =
  supabaseUrl &&
  !supabaseUrl.includes('xyzcompany') &&
  !supabaseUrl.includes('localhost');

const baseUrl = `${supabaseUrl}/functions/v1/api`;

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
  if (!hasSupabase) return [];
  try {
    const res = await fetch(`${baseUrl}/customers`, { headers: headers() });
    const body = await handle<{ data: Customer[] }>(res);
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function createCustomer(input: {
  name: string;
  email?: string;
  phone?: string;
}): Promise<Customer> {
  if (!hasSupabase) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const res = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const body = await handle<{ data: Customer }>(res);
  return body.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!hasSupabase) return;
  try {
    const res = await fetch(`${baseUrl}/customers/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    await handle<{ success: boolean }>(res);
  } catch {
    // Ignore offline errors
  }
}

// ==================== Products ====================

export async function fetchProducts(): Promise<Product[]> {
  if (!hasSupabase) return [];
  try {
    const res = await fetch(`${baseUrl}/products`, { headers: headers() });
    const body = await handle<{ data: Product[] }>(res);
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function createProduct(input: {
  name: string;
  sku?: string;
  price: number;
  stock: number;
  tax_rate: number;
}): Promise<Product> {
  if (!hasSupabase) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      sku: input.sku ?? null,
      price: input.price,
      stock: input.stock,
      tax_rate: input.tax_rate,
      created_at: new Date().toISOString(),
    };
  }
  const res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const body = await handle<{ data: Product }>(res);
  return body.data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!hasSupabase) return;
  try {
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    await handle<{ success: boolean }>(res);
  } catch {
    // Ignore offline errors
  }
}

// ==================== Invoices ====================

export async function fetchInvoices(): Promise<InvoiceWithDetails[]> {
  if (!hasSupabase) return [];
  try {
    const res = await fetch(`${baseUrl}/invoices`, { headers: headers() });
    const body = await handle<{ data: InvoiceWithDetails[] }>(res);
    return body.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
  if (!hasSupabase) return null;
  try {
    const res = await fetch(`${baseUrl}/invoices/${id}`, { headers: headers() });
    if (res.status === 404) return null;
    const body = await handle<{ data: InvoiceWithDetails }>(res);
    return body.data;
  } catch {
    return null;
  }
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
  const totals = computeTotals(input.items, input.discount);
  const id = crypto.randomUUID();
  const number = `INV-${Date.now().toString().slice(-6)}`;

  if (!hasSupabase) {
    return { id, number, totals };
  }

  try {
    const res = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(input),
    });
    const body = await handle<{ data: { id: string; number: string }; totals: InvoiceTotals }>(res);
    return { id: body.data.id, number: body.data.number, totals: body.totals };
  } catch {
    return { id, number, totals };
  }
}

// ==================== AI Receipt OCR ====================

export interface ParsedReceipt {
  vendorName?: string;
  vendor?: string;
  items: { name: string; price: number; quantity: number }[];
  tax?: number;
  total: number;
}

export async function parseReceipt(file: File): Promise<{ data: ParsedReceipt; source: string }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Validates that the API key exists and isn't a dummy string
  if (apiKey && apiKey.length > 5 && !apiKey.includes('your_actual')) {
    try {
      // 1. Read image as Base64 string
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Call Gemini API directly from browser
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Extract billing data from this image and return ONLY a valid JSON object matching this structure with no markdown or code blocks:
{
  "vendor": "Vendor or Customer Name",
  "total": 389.00,
  "items": [
    { "name": "Item Name", "quantity": 1, "price": 50.00 }
  ]
}`,
                  },
                  {
                    inlineData: {
                      mimeType: file.type || 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const body = await res.json();
        const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return { data: parsed, source: 'gemini' };
        }
      }
    } catch (e) {
      console.warn('Gemini request failed; using local demo fallback:', e);
    }
  }

  // Local fallback demo parser (used if key is missing)
  return {
    source: 'mock',
    data: {
      vendor: 'Acme Supplies Inc.',
      total: 389.0,
      items: [
        { name: 'Ergonomic Office Chair', quantity: 2, price: 150.0 },
        { name: 'Wireless Mechanical Keyboard', quantity: 1, price: 80.0 },
      ],
    },
  };
}

export { supabase, computeTotals };