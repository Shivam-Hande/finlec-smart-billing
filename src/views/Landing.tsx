import { Link } from 'react-router-dom';
import {
  Sparkles,
  ScanLine,
  Calculator,
  Users,
  Package,
  FileText,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  TrendingUp,
  Bell,
} from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Smart Billing</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-200 transition shadow-sm"
          >
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-5 sm:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-emerald-300 mb-8 animate-[fadeIn_0.6s_ease]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            New: AI receipt scanning & smart reminders
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05]">
            Smart Invoicing for
            <span className="block mt-2 bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              Modern Businesses
            </span>
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create invoices in seconds, auto-calculate taxes and discounts, scan receipts with AI,
            and send smart payment reminders — all from one beautifully simple dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-semibold hover:from-emerald-300 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
            >
              Explore features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Real-time calculations</span>
            <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> PDF export</span>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="features" className="py-20 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Built for speed and accuracy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<ScanLine className="w-6 h-6" />}
              title="AI Receipt OCR"
              accent="emerald"
              desc="Upload a receipt and watch line items auto-fill instantly. Our scanner matches products by name and SKU."
            />
            <FeatureCard
              icon={<Calculator className="w-6 h-6" />}
              title="Automated Calculations"
              accent="teal"
              desc="Subtotals, per-line tax, discounts, and grand totals update in real time as you build each invoice."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Customer Management"
              accent="sky"
              desc="Keep a clean directory of clients with names, emails, and phones — linked straight to their invoices."
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Inventory Control"
              accent="violet"
              desc="Track products with prices, SKUs, stock counts, and tax rates. Low-stock alerts keep you ahead."
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="PDF Invoice Preview"
              accent="amber"
              desc="Generate polished, printable invoices with one click. Save as PDF straight from the browser."
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6" />}
              title="AI Payment Reminders"
              accent="rose"
              desc="Draft friendly, firm, or urgent reminder emails in a click — tuned to how overdue an invoice is."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20 px-5 sm:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">From receipt to paid in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { icon: <ScanLine className="w-5 h-5" />, step: '01', title: 'Scan receipt', desc: 'Upload a receipt and let AI detect your products.' },
              { icon: <Calculator className="w-5 h-5" />, step: '02', title: 'Build invoice', desc: 'Quantities, tax, and totals calculate automatically.' },
              { icon: <FileText className="w-5 h-5" />, step: '03', title: 'Send PDF', desc: 'Preview a polished invoice and export to PDF.' },
              { icon: <Bell className="w-5 h-5" />, step: '04', title: 'Get paid', desc: 'AI reminders nudge customers until payment lands.' },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl bg-white/[0.03] border border-white/5 p-6 hover:bg-white/[0.05] transition group">
                <span className="text-xs font-mono font-bold text-emerald-400/70">{s.step}</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center mt-3 mb-4 group-hover:scale-110 transition">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-16 px-5 sm:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Zap className="w-5 h-5" />, value: '< 30s', label: 'To build an invoice' },
            { icon: <TrendingUp className="w-5 h-5" />, value: '100%', label: 'Accurate tax math' },
            { icon: <ShieldCheck className="w-5 h-5" />, value: 'RLS', label: 'Secured data' },
            { icon: <FileText className="w-5 h-5" />, value: 'PDF', label: 'One-click export' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-emerald-300 flex items-center justify-center mb-3">
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Ready to bill smarter?</h2>
          <p className="mt-4 text-slate-400 text-lg">Launch the dashboard and create your first invoice in under a minute.</p>
          <Link
            to="/dashboard"
            className="group mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-semibold hover:from-emerald-300 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-300">Smart Billing</span>
          </div>
          <p>Built for modern businesses. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 group-hover:scale-110',
  teal: 'bg-teal-500/10 text-teal-300 group-hover:scale-110',
  sky: 'bg-sky-500/10 text-sky-300 group-hover:scale-110',
  violet: 'bg-violet-500/10 text-violet-300 group-hover:scale-110',
  amber: 'bg-amber-500/10 text-amber-300 group-hover:scale-110',
  rose: 'bg-rose-500/10 text-rose-300 group-hover:scale-110',
};

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className="group rounded-2xl bg-white/[0.03] border border-white/5 p-7 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition ${ACCENTS[accent]}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
