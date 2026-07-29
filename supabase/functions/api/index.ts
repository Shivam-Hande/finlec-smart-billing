import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "npm:hono@4.6.14";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  await next();
});

function json(c: any, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(c: any, message: string, status: number) {
  return json(c, { error: message }, status);
}

// ==================== CUSTOMERS ====================

app.get("/api/customers", async (c) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { data });
  } catch (err) {
    return errorResponse(c, "Failed to fetch customers", 500);
  }
});

app.post("/api/customers", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return errorResponse(c, "Customer name is required", 400);
    }
    const payload = {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
    };
    const { data, error } = await supabase
      .from("customers")
      .insert(payload)
      .select()
      .single();
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { data }, 201);
  } catch (err) {
    return errorResponse(c, "Failed to create customer", 500);
  }
});

app.delete("/api/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) return errorResponse(c, "Customer ID is required", 400);
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { success: true });
  } catch (err) {
    return errorResponse(c, "Failed to delete customer", 500);
  }
});

// ==================== PRODUCTS ====================

app.get("/api/products", async (c) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { data });
  } catch (err) {
    return errorResponse(c, "Failed to fetch products", 500);
  }
});

app.post("/api/products", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return errorResponse(c, "Product name is required", 400);
    }
    const payload = {
      name: body.name.trim(),
      sku: body.sku?.trim() || null,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      tax_rate: Number(body.tax_rate) || 0,
    };
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { data }, 201);
  } catch (err) {
    return errorResponse(c, "Failed to create product", 500);
  }
});

app.delete("/api/products/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) return errorResponse(c, "Product ID is required", 400);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { success: true });
  } catch (err) {
    return errorResponse(c, "Failed to delete product", 500);
  }
});

// ==================== INVOICES ====================

app.get("/api/invoices", async (c) => {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customer:customers(*), invoice_items(*)")
      .order("created_at", { ascending: false });
    if (error) return errorResponse(c, error.message, 500);
    return json(c, { data });
  } catch (err) {
    return errorResponse(c, "Failed to fetch invoices", 500);
  }
});

app.get("/api/invoices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) return errorResponse(c, "Invoice ID is required", 400);
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customer:customers(*), invoice_items(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return errorResponse(c, error.message, 500);
    if (!data) return errorResponse(c, "Invoice not found", 404);
    return json(c, { data });
  } catch (err) {
    return errorResponse(c, "Failed to fetch invoice", 500);
  }
});

app.post("/api/invoices", async (c) => {
  try {
    const body = await c.req.json();

    // --- Validate required fields ---
    if (!body.customer_id || typeof body.customer_id !== "string") {
      return errorResponse(c, "customer_id is required", 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse(c, "At least one invoice item is required", 400);
    }

    // --- Fetch product records server-side to enforce real pricing ---
    const productIds = body.items
      .map((it: any) => it.product_id)
      .filter((id: string) => id);
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, tax_rate")
      .in("id", productIds);
    if (prodErr) return errorResponse(c, "Failed to verify products", 500);

    const productMap = new Map(products.map((p) => [p.id, p]));

    // --- Server-side calculation: subtotal, tax, discount, grand total ---
    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = body.items.map((it: any, idx: number) => {
      const product = it.product_id ? productMap.get(it.product_id) : null;
      // Use server-verified price and tax_rate, NOT client-supplied values
      const unitPrice = product ? Number(product.price) : Number(it.unit_price) || 0;
      const taxRate = product ? Number(product.tax_rate) : Number(it.tax_rate) || 0;
      const name = product ? product.name : (it.name || "Custom Item");
      const quantity = Math.max(1, Math.floor(Number(it.quantity) || 1));

      const lineSubtotal = unitPrice * quantity;
      const lineTax = lineSubtotal * (taxRate / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        product_id: it.product_id || null,
        name,
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
      };
    });

    // --- Enforce discount server-side ---
    const clientDiscount = Number(body.discount) || 0;
    const discount = Math.min(Math.max(clientDiscount, 0), subtotal + taxAmount);
    const grandTotal = Math.max(subtotal + taxAmount - discount, 0);

    // --- Generate invoice number server-side ---
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const number = `INV-${ymd}-${rand}`;

    // --- Insert invoice ---
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        number,
        customer_id: body.customer_id,
        status: body.status || "unpaid",
        issue_date: body.issue_date || date.toISOString().slice(0, 10),
        due_date: body.due_date || null,
        discount,
        notes: body.notes?.trim() || null,
      })
      .select("id")
      .single();
    if (invErr || !invoice) {
      return errorResponse(c, invErr?.message || "Failed to create invoice", 500);
    }

    // --- Insert line items ---
    const itemsWithInvoiceId = computedItems.map((it) => ({
      ...it,
      invoice_id: invoice.id,
    }));
    const { error: itemsErr } = await supabase
      .from("invoice_items")
      .insert(itemsWithInvoiceId);
    if (itemsErr) {
      // Rollback: delete the invoice if items failed
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return errorResponse(c, "Failed to create invoice items", 500);
    }

    // --- Return computed totals alongside the invoice ---
    return json(c, {
      data: { id: invoice.id, number },
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
      },
    }, 201);
  } catch (err) {
    return errorResponse(c, "Failed to create invoice", 500);
  }
});

Deno.serve(app.fetch);
