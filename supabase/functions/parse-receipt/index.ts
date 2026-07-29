import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface ParsedReceipt {
  vendorName: string;
  items: { name: string; price: number; quantity: number }[];
  tax: number;
  total: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let base64Image: string;
    let mimeType: string;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      base64Image = body.image;
      mimeType = body.mimeType || "image/jpeg";
      if (!base64Image) {
        return new Response(
          JSON.stringify({ error: "Missing 'image' field (base64-encoded file data)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "Missing 'file' in form data." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      base64Image = btoa(String.fromCharCode(...bytes));
      mimeType = file.type || "image/jpeg";
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported content type. Send JSON or multipart form data." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    // --- Try Gemini Vision API if key is configured ---
    if (apiKey) {
      try {
        const result = await callGemini(base64Image, mimeType, apiKey);
        return new Response(
          JSON.stringify({ data: result, source: "gemini" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        // Fall through to mock parser on API failure
        console.error("Gemini API failed, using fallback:", err);
      }
    }

    // --- Fallback: deterministic mock parser ---
    const fallback = mockParseReceipt();
    return new Response(
      JSON.stringify({ data: fallback, source: "mock" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to parse receipt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callGemini(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ParsedReceipt> {
  const prompt = `Extract the receipt details and return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "vendorName": "string - the store/vendor name",
  "items": [{ "name": "string", "price": number, "quantity": number }],
  "tax": number,
  "total": number
}
Rules:
- Extract every line item from the receipt.
- price and total are in dollars (numbers, not strings).
- quantity defaults to 1 if not specified.
- tax is the total tax amount (number).
- If a field can't be determined, use an empty string or 0.
- Output ONLY the JSON object, nothing else.`;

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let parsed: ParsedReceipt;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Strip markdown fences if present
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  // Validate shape
  return {
    vendorName: String(parsed.vendorName || ""),
    items: Array.isArray(parsed.items)
      ? parsed.items.map((it: any) => ({
          name: String(it.name || ""),
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        }))
      : [],
    tax: Number(parsed.tax) || 0,
    total: Number(parsed.total) || 0,
  };
}

function mockParseReceipt(): ParsedReceipt {
  return {
    vendorName: "Office Supply Co.",
    items: [
      { name: "Wireless Mouse", price: 29.99, quantity: 2 },
      { name: "USB-C Cable 2m", price: 12.5, quantity: 3 },
      { name: "Notebook A5", price: 4.75, quantity: 5 },
    ],
    tax: 8.25,
    total: 130.98,
  };
}
