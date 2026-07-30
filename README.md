# finlec-smart-billing

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-5dn1yzma)
[![Deploy with Vercel](https://vercel.com/button)](https://finlec-smart-billing.vercel.app)

# Smart Billing Application — Finlec Full Stack Assessment

A modern, responsive Smart Billing Application built with **React**, **TypeScript**, **Tailwind CSS**, and **Gemini AI Vision OCR**.

🌐 **Live Demo:** [https://finlec-smart-billing.vercel.app](https://finlec-smart-billing.vercel.app)

---

## 🌟 Key Features

- **📊 Dashboard Analytics:** Live tracking of total revenue, unpaid invoices, and customer metrics.
- **👥 Customer & Inventory Management:** Full CRUD capabilities to manage customer profiles and product inventory.
- **🤖 Smart AI Receipt OCR:** Powered by Google Gemini AI Vision API to automatically parse receipt images/PDFs and extract customer names, issue/due dates, discounts, tax rates, and line items directly into the form.
- **🧮 Real-time Calculations:** Live computation of subtotals, item-level taxes, custom discounts, and grand totals.
- **💾 Local Storage Fallback:** Runs seamlessly locally using browser storage even without an active Supabase backend.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React Icons
- **AI Engine:** Google Gemini AI Vision REST API (`gemini-1.5-flash` / `gemini-2.5-flash`)
- **Backend / Database Layer:** Supabase JS Client & LocalStorage persistence layer
- **Deployment:** Vercel
- **Build Tool:** Vite

---

## 🚀 Setup & Local Development

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/Shivam-Hande/finlec-smart-billing.git](https://github.com/Shivam-Hande/finlec-smart-billing.git)
   cd finlec-smart-billing
