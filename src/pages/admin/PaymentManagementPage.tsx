import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Download, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await adminApi.getPayments({ status: statusFilter || undefined });
      setPayments(res.results || res);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleConfirm = async (invoiceId: string) => {
    if (confirm('Confirm receipt of this payment?')) {
      try {
        await adminApi.confirmPayment(invoiceId);
        toast.success('Payment confirmed');
        fetchPayments();
      } catch (err) {
        toast.error('Failed to confirm payment');
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    { header: 'Invoice ID', accessorKey: 'invoice_id' },
    { header: 'ARN', cell: (i) => <span className="font-medium text-primary">{i.application_arn}</span> },
    { header: 'Amount', cell: (i) => `${i.amount_etb.toLocaleString()} ETB` },
    { header: 'Method', cell: (i) => i.payment_method || 'N/A' },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    { header: 'Receipt', cell: (i) => (
      i.receipt_file ? 
        <button className="text-primary hover:underline flex items-center">
          <Download className="w-4 h-4 mr-1" /> View
        </button>
      : 'No File'
    )},
    { header: 'Actions', cell: (i) => (
      <button 
        onClick={() => handleConfirm(i.invoice_id)} 
        disabled={i.status === 'COMPLETED'}
        className={`btn py-1 px-3 text-xs ${i.status === 'COMPLETED' ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-none' : 'btn-outline border-green-600 text-green-600 hover:bg-green-50'}`}
      >
        <CheckCircle className="w-3 h-3 mr-1" /> Confirm
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner fullPage />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Payment Management</h1>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input type="text" placeholder="Search by Invoice ID or ARN..." className="input-field pl-10" />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <DataTable data={payments} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
