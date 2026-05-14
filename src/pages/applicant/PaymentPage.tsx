import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentsApi } from '@/services/api/payments';
import { applicationsApi } from '@/services/api/applications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploader } from '@/components/forms/FileUploader';
import { CheckCircle, CreditCard, Building2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Find invoice for this application
        const appData = await applicationsApi.getById(applicationId!);
        // For simplicity, assuming the invoice ID is accessible or we fetch it.
        // The API spec actually returns the invoice_id in the submit response, 
        // so we might need a dedicated endpoint to get the active invoice for an app.
        // We'll mock the fetch for now.
        setInvoice({
          invoice_id: 'INV-12345',
          amount_etb: appData.calculated_fee || 5000,
          application_arn: appData.arn,
          status: 'PENDING',
          fee_breakdown: {
            base_fee: 3000,
            fixed_fee: 2000,
            total: 5000,
            base_description: 'Area calculation',
            fixed_description: 'Processing fee'
          }
        });
      } catch (err) {
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [applicationId]);

  const handleDigitalPayment = async () => {
    if (!selectedMethod) return toast.error('Select a payment method');
    setProcessing(true);
    
    // Simulate digital payment processing (Telebirr/CBE)
    setTimeout(async () => {
      try {
        await paymentsApi.pay(invoice.invoice_id, { payment_method: selectedMethod });
        toast.success('Payment successful!');
        navigate(`/applicant/applications/${applicationId}`);
      } catch (err) {
        toast.error('Payment failed');
      } finally {
        setProcessing(false);
      }
    }, 3000);
  };

  const handleBankReceiptUpload = async (files: File[]) => {
    if (!files.length) return;
    setProcessing(true);
    const formData = new FormData();
    formData.append('receipt', files[0]);
    try {
      await paymentsApi.uploadReceipt(invoice.invoice_id, formData);
      toast.success('Receipt uploaded. Awaiting manual confirmation.');
      navigate(`/applicant/applications/${applicationId}`);
    } catch (err) {
      toast.error('Failed to upload receipt');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary mb-8">Pay Application Fee</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">Invoice Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Application ARN</span>
              <span className="font-medium text-slate-800">{invoice.application_arn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice ID</span>
              <span className="font-medium text-slate-800">{invoice.invoice_id}</span>
            </div>
            
            <div className="bg-highlight/10 border border-highlight rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-slate-800 mb-3">Fee Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{invoice.fee_breakdown.base_description}</span>
                  <span>{invoice.fee_breakdown.base_fee.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{invoice.fee_breakdown.fixed_description}</span>
                  <span>{invoice.fee_breakdown.fixed_fee.toLocaleString()} ETB</span>
                </div>
                <div className="border-t border-highlight/30 pt-2 mt-2 flex justify-between font-bold text-lg text-primary">
                  <span>Total Amount</span>
                  <span>{invoice.amount_etb.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">Select Payment Method</h2>
          
          <div className="space-y-4">
            <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'TELEBIRR' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}>
              <div className="flex items-center">
                <input type="radio" name="paymentMethod" value="TELEBIRR" className="hidden" onChange={() => setSelectedMethod('TELEBIRR')} />
                <Smartphone className="w-6 h-6 text-primary mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">Telebirr</h3>
                  <p className="text-sm text-slate-500">Pay directly using Telebirr app</p>
                </div>
                {selectedMethod === 'TELEBIRR' && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
            </label>

            <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'CBEBIRR' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}>
              <div className="flex items-center">
                <input type="radio" name="paymentMethod" value="CBEBIRR" className="hidden" onChange={() => setSelectedMethod('CBEBIRR')} />
                <Smartphone className="w-6 h-6 text-primary mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">CBE Birr</h3>
                  <p className="text-sm text-slate-500">Pay via CBE mobile banking</p>
                </div>
                {selectedMethod === 'CBEBIRR' && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
            </label>

            <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}>
              <div className="flex items-center">
                <input type="radio" name="paymentMethod" value="BANK_TRANSFER" className="hidden" onChange={() => setSelectedMethod('BANK_TRANSFER')} />
                <Building2 className="w-6 h-6 text-primary mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">Bank Transfer</h3>
                  <p className="text-sm text-slate-500">Upload deposit slip manually</p>
                </div>
                {selectedMethod === 'BANK_TRANSFER' && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
            </label>
          </div>

          <div className="mt-8">
            {(selectedMethod === 'TELEBIRR' || selectedMethod === 'CBEBIRR') && (
              <button 
                onClick={handleDigitalPayment} 
                disabled={processing}
                className="w-full btn btn-primary py-3 flex items-center justify-center"
              >
                {processing ? <LoadingSpinner size="sm" className="mr-2 text-white" /> : <CreditCard className="w-5 h-5 mr-2" />}
                {processing ? 'Processing Payment...' : 'Pay Now'}
              </button>
            )}

            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                  <p className="font-semibold mb-2">Bank Details:</p>
                  <p>Bank: Commercial Bank of Ethiopia</p>
                  <p>Account: 1000123456789</p>
                  <p>Name: ACPS Admin Office</p>
                  <p className="text-danger mt-2">Include your ARN ({invoice.application_arn}) in the reason field.</p>
                </div>
                <FileUploader 
                  onUpload={handleBankReceiptUpload}
                  acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                  maxSizeMB={5}
                  label="Upload Deposit Slip"
                />
                {processing && <p className="text-center text-sm text-primary animate-pulse">Uploading receipt...</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
