import { useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, PageHeader, Button, StatusBadge } from '@/components/ui';
import { useInvoices, useCustomers, useProducts } from '@/lib/hooks';
import {
  computeTotals,
  formatCurrency,
  deriveStatus,
  type InvoiceWithDetails,
} from '@/lib/types';

export function Dashboard({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { invoices, loading: invLoading } = useInvoices();
  const { customers } = useCustomers();
  const { products } = useProducts();

  // Helper to safely get the grand total of an invoice
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

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let unpaidCount = 0;

    invoices.forEach((inv) => {
      const status = deriveStatus(inv);
      const total = getGrandTotal(inv);

      if (status === 'paid') {
        totalRevenue += total;
        paidCount++;
      } else if (status === 'overdue') {
        overdueCount++;
      } else {
        unpaidCount++;
      }
    });

    return { totalRevenue, paidCount, overdueCount, unpaidCount };
  }, [invoices]);

  // Monthly Revenue Chart Data
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2);
      months[key] = 0;
    }

    invoices.forEach((inv) => {
      if (!inv.issue_date) return;
      const d = new Date(inv.issue_date);
      const key = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2);
      if (key in months) {
        months[key] += getGrandTotal(inv);
      }
    });

    const entries = Object.entries(months);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    return { entries, maxVal };
  }, [invoices]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your billing activity"
        action={
          <Button onClick={() => onNavigate('builder')}>
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(metrics.totalRevenue)}</h3>
            <p className="text-xs text-slate-400 mt-1">{metrics.paidCount} paid invoices</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Paid Invoices</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.paidCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Collected successfully</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overdue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.overdueCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Needs attention</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Outstanding</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.unpaidCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Awaiting payment</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue by Month</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months of invoiced totals</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              ↗ Live
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {monthlyData.entries.map(([label, amount]) => {
              const heightPercent = Math.max((amount / monthlyData.maxVal) * 100, 8);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                    {formatCurrency(amount)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-emerald-500/80 hover:bg-emerald-600 rounded-t-lg transition-all duration-300"
                  />
                  <span className="text-[11px] text-slate-400 font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* At a glance & Recent Invoices */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-4">At a glance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Customers</span>
                <span className="font-bold text-slate-900">{customers.length}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-50">
                <span className="text-slate-500">Total Invoices</span>
                <span className="font-bold text-slate-900">{invoices.length}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-50">
                <span className="text-slate-500">Products in Stock</span>
                <span className="font-bold text-slate-900">{products.length}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Recent invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400">No invoices generated yet.</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-900">{inv.customer?.name ?? '—'}</p>
                      <p className="text-slate-400">{inv.issue_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(getGrandTotal(inv))}</p>
                    </div>
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