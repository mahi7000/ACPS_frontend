import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Download, CheckCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [confirmData, setConfirmData] = useState({
    transaction_reference: '',
    confirmed_amount: '',
    notes: ''
  });

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

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !confirmData.transaction_reference || !confirmData.confirmed_amount) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.confirmPayment(selectedInvoice.invoice_id, {
        transaction_reference: confirmData.transaction_reference,
        confirmed_amount: Number(confirmData.confirmed_amount),
        ...(confirmData.notes && { notes: confirmData.notes })
      });
      toast.success('Payment confirmed successfully');
      setConfirmModalOpen(false);
      fetchPayments();
      setConfirmData({ transaction_reference: '', confirmed_amount: '', notes: '' });
    } catch (err) {
      toast.error('Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    { header: 'Invoice ID', accessorKey: 'invoice_id' },
    { header: 'ARN', cell: (i) => <span className="font-medium text-primary">{i.application_arn || i.arn}</span> },
    { header: 'Amount', cell: (i) => `${(i.amount_etb || 0).toLocaleString()} ETB` },
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
        onClick={() => {
          setSelectedInvoice(i);
          setConfirmData({
            transaction_reference: '',
            confirmed_amount: i.amount_etb || '',
            notes: ''
          });
          setConfirmModalOpen(true);
        }} 
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
              <option value="AWAITING_MANUAL_CONFIRMATION">Awaiting Confirmation</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <DataTable data={payments} columns={columns} loading={loading} />
      </div>

      {confirmModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Confirm Bank Transfer</h2>
              <button onClick={() => setConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Confirming payment for Invoice <strong>{selectedInvoice.invoice_id}</strong> (ARN: {selectedInvoice.application_arn || selectedInvoice.arn}).
                </p>
              </div>
              <div>
                <label className="label">Transaction Reference *</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  placeholder="e.g. TRX-20260515-001234"
                  value={confirmData.transaction_reference}
                  onChange={(e) => setConfirmData({...confirmData, transaction_reference: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Confirmed Amount (ETB) *</label>
                <input 
                  type="number" 
                  required 
                  step="0.01"
                  className="input-field" 
                  value={confirmData.confirmed_amount}
                  onChange={(e) => setConfirmData({...confirmData, confirmed_amount: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  placeholder="Bank receipt verified - funds cleared"
                  value={confirmData.notes}
                  onChange={(e) => setConfirmData({...confirmData, notes: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" className="btn btn-outline" onClick={() => setConfirmModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary bg-green-600 border-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Confirming...' : 'Verify & Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
