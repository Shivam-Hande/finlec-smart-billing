import { useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { Card, PageHeader, Button } from '@/components/ui';
import { useInvoices, useCustomers, useProducts } from '@/lib/hooks';
import { formatCurrency, formatDate, computeTotals, deriveStatus } from '@/lib/types';

export function Dashboard({ onNavigate }: { onNavigate: (v: 'builder' | 'invoices' | 'customers' | 'products' | 'dashboard') => void }) {
  const { invoices } = useInvoices();
  const { customers } = useCustomers();
  const { products } = useProducts();

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let unpaidCount = 0;
    const monthly: Record<string, number> = {};

    invoices.forEach((inv) => {
      const totals = computeTotals(
        inv.invoice_items?.map((it) => ({
          product_id: it.product_id,
          name: it.name,
          quantity: it.quantity,
          unit_price: Number(it.unit_price),
          tax_rate: Number(it.tax_rate),
        })) ?? [],
        Number(inv.discount)
      );
      const status = deriveStatus(inv);
      if (status === 'paid') {
        totalRevenue += totals.grandTotal;
        paidCount++;
      } else if (status === 'overdue') {
        overdueCount++;
      } else {
        unpaidCount++;
      }
      const key = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthly[key] = (monthly[key] ?? 0) + totals.grandTotal;
    });

    const months = Object.entries(monthly).slice(-6);
    return { totalRevenue, paidCount, overdueCount, unpaidCount, months };
  }, [invoices]);

  const maxMonthly = Math.max(...metrics.months.map((m) => m[1]), 1);

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your billing activity"
        action={
          <Button onClick={() => onNavigate('builder')}>
            <FileText className="w-4 h-4" /> Create Invoice
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
          sub={`${metrics.paidCount} paid invoices`}
        />
        <MetricCard
          label="Paid Invoices"
          value={String(metrics.paidCount)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="sky"
          sub="Collected successfully"
        />
        <MetricCard
          label="Overdue"
          value={String(metrics.overdueCount)}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="rose"
          sub="Needs attention"
        />
        <MetricCard
          label="Outstanding"
          value={String(metrics.unpaidCount)}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="amber"
          sub="Awaiting payment"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Revenue by Month</h2>
              <p className="text-sm text-slate-500">Last 6 months of invoiced totals</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live
            </div>
          </div>
          {metrics.months.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              No invoice data yet
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-56">
              {metrics.months.map(([label, value]) => {
                const heightPct = Math.max((value / maxMonthly) * 100, 4);
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500 group-hover:from-emerald-600 group-hover:to-teal-500"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          {formatCurrency(value)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick stats */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">At a glance</h3>
            <div className="space-y-3">
              <StatRow icon={<Users className="w-4 h-4 text-slate-400" />} label="Customers" value={String(customers.length)} onClick={() => onNavigate('customers')} />
              <StatRow icon={<FileText className="w-4 h-4 text-slate-400" />} label="Total Invoices" value={String(invoices.length)} onClick={() => onNavigate('invoices')} />
              <StatRow icon={<TrendingUp className="w-4 h-4 text-slate-400" />} label="Products in Stock" value={String(products.length)} onClick={() => onNavigate('products')} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Recent invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No invoices yet</p>
            ) : (
              <div className="space-y-2.5">
                {invoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate">{inv.number}</p>
                      <p className="text-xs text-slate-400">{inv.customer?.name ?? '—'} · {formatDate(inv.issue_date)}</p>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0 ml-2">
                      {formatCurrency(
                        computeTotals(
                          inv.invoice_items?.map((it) => ({
                            product_id: it.product_id, name: it.name, quantity: it.quantity,
                            unit_price: Number(it.unit_price), tax_rate: Number(it.tax_rate),
                          })) ?? [],
                          Number(inv.discount)
                        ).grandTotal
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
};

function MetricCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: keyof typeof ACCENTS;
  sub: string;
}) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ACCENTS[accent]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">{sub}</p>
    </Card>
  );
}

function StatRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition text-left">
      <span className="flex items-center gap-2.5 text-sm text-slate-600">
        {icon} {label}
      </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </button>
  );
}
