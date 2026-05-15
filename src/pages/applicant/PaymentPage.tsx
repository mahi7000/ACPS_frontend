import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paymentsApi } from '@/services/api/payments';
import { applicationsApi } from '@/services/api/applications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploader } from '@/components/forms/FileUploader';
import { CheckCircle, CreditCard, Building2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [bankDetails, setBankDetails] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Check if we have an invoice_id in the query params
        const invoiceIdFromParams = searchParams.get('invoice_id');

        // If we have invoice_id in query params, use it directly
        if (invoiceIdFromParams) {
          const invoiceData = await paymentsApi.getInvoice(invoiceIdFromParams);
          setInvoice(invoiceData);
          setLoading(false);
          return;
        }

        // Check if the URL parameter is an invoice ID (starts with INV-)
        if (applicationId && applicationId.startsWith('INV-')) {
          // It's already an invoice ID
          const invoiceData = await paymentsApi.getInvoice(applicationId);
          setInvoice(invoiceData);
          setLoading(false);
          return;
        }

        // It's an application ID (UUID), we need to find the invoice
        if (applicationId) {
          try {
            // Try to get invoices for this application
            const invoiceData = await applicationsApi.getInvoiceByApplication(applicationId);
            const invoices = invoiceData.results || invoiceData;
            const invoice = Array.isArray(invoices) ? invoices[0] : invoices;

            if (invoice?.invoice_id) {
              const invoiceDetails = await paymentsApi.getInvoice(invoice.invoice_id);
              setInvoice(invoiceDetails);
            } else {
              toast.error('No invoice found for this application. The application may need to be submitted first.');
            }
          } catch (err) {
            console.error('Failed to fetch invoice for application:', err);
            toast.error('Could not find invoice for this application.');
          }
        } else {
          toast.error('No application or invoice ID provided.');
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
        toast.error('Could not find a valid invoice.');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchInvoice();
    }
  }, [applicationId, searchParams]);

  const handleDigitalPayment = async () => {
    if (!selectedMethod) {
      toast.error('Select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const targetId = invoice.invoice_id || invoice.id;
      const response = await paymentsApi.pay(targetId, { payment_method: selectedMethod });

      if (response.status === 'CONFIRMED') {
        toast.success('Payment successful! Your application is now awaiting assignment.');
        // Navigate back to application details or dashboard
        if (invoice.application_id) {
          navigate(`/applicant/applications/${invoice.application_id}`);
        } else {
          navigate('/applicant/dashboard');
        }
      } else if (response.status === 'AWAITING_MANUAL_CONFIRMATION') {
        // This shouldn't happen for digital payments, but handle it
        setBankDetails(response.bank_details);
        toast.success('Bank transfer details received. Please upload receipt.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Payment failed';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!selectedMethod) {
      toast.error('Select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const targetId = invoice.invoice_id || invoice.id;
      const response = await paymentsApi.pay(targetId, { payment_method: 'BANK_TRANSFER' });

      if (response.status === 'AWAITING_UPLOAD' && response.bank_details) {
        setBankDetails(response.bank_details);
        toast.success(response.message || 'Please upload your bank receipt for confirmation');
      } else if (response.status === 'AWAITING_MANUAL_CONFIRMATION' && response.bank_details) {
        setBankDetails(response.bank_details);
        toast.success(response.message || 'Please upload your bank receipt for confirmation');
      }
    } catch (err: any) {
      console.error('Bank transfer initiation error:', err);
      toast.error(err.response?.data?.detail || 'Failed to initiate bank transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleBankReceiptUpload = async (files: File[]) => {
    if (!files.length) return;
    setProcessing(true);
    const formData = new FormData();
    formData.append('receipt', files[0]);

    try {
      const response = await paymentsApi.uploadReceipt(invoice.invoice_id, formData);
      toast.success(response.detail || 'Receipt uploaded. Awaiting manual confirmation.');
      // Navigate back to application details or dashboard
      if (invoice.application_id) {
        navigate(`/applicant/applications/${invoice.application_id}`);
      } else {
        navigate('/applicant/dashboard');
      }
    } catch (err: any) {
      console.error('Receipt upload error:', err);
      toast.error(err.response?.data?.detail || 'Failed to upload receipt');
    } finally {
      setProcessing(false);
    }
  };

  const handleMethodSelection = async (method: string) => {
    setSelectedMethod(method);
    setBankDetails(null);

    // If bank transfer is selected, immediately get bank details
    if (method === 'BANK_TRANSFER') {
      await handleBankTransfer();
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!invoice) return (
    <div className="text-center py-8">
      <p className="text-lg text-slate-600">{t('payment.not_found')}</p>
      <button
        onClick={() => navigate('/applicant/dashboard')}
        className="btn btn-primary mt-4"
      >
        {t('payment.go_to_dashboard')}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary mb-8">{t('payment.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">{t('payment.invoice_summary')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('payment.app_arn')}</span>
              <span className="font-medium text-slate-800">{invoice.application_arn || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('payment.invoice_id')}</span>
              <span className="font-medium text-slate-800">{invoice.invoice_id}</span>
            </div>

            <div className="bg-highlight/10 border border-highlight rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-slate-800 mb-3">{t('payment.fee_breakdown')}</h3>
              <div className="space-y-2 text-sm">
                {invoice.fee_breakdown ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{invoice.fee_breakdown.base_description || t('payment.base_fee')}</span>
                      <span>{(invoice.fee_breakdown.base_fee || 0).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{invoice.fee_breakdown.fixed_description || t('payment.fixed_fee')}</span>
                      <span>{(invoice.fee_breakdown.fixed_fee || 0).toLocaleString()} ETB</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('payment.total_fee')}</span>
                    <span>{(invoice.amount_etb || 0).toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="border-t border-highlight/30 pt-2 mt-2 flex justify-between font-bold text-lg text-primary">
                  <span>{t('payment.total_amount')}</span>
                  <span>{(invoice.amount_etb || 0).toLocaleString()} ETB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">{t('payment.select_method')}</h2>

          <div className="space-y-4">
            {(invoice.available_methods || ['TELEBIRR', 'CBEBIRR', 'BANK_TRANSFER']).includes('TELEBIRR') && (
              <div
                className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'TELEBIRR' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}
                onClick={() => handleMethodSelection('TELEBIRR')}
              >
                <div className="flex items-center">
                  <Smartphone className="w-6 h-6 text-primary mr-3" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Telebirr</h3>
                    <p className="text-sm text-slate-500">{t('payment.pay_telebirr')}</p>
                  </div>
                  {selectedMethod === 'TELEBIRR' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>
            )}

            {(invoice.available_methods || ['TELEBIRR', 'CBEBIRR', 'BANK_TRANSFER']).includes('CBEBIRR') && (
              <div
                className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'CBEBIRR' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}
                onClick={() => handleMethodSelection('CBEBIRR')}
              >
                <div className="flex items-center">
                  <Smartphone className="w-6 h-6 text-primary mr-3" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">CBE Birr</h3>
                    <p className="text-sm text-slate-500">{t('payment.pay_cbe')}</p>
                  </div>
                  {selectedMethod === 'CBEBIRR' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>
            )}

            {(invoice.available_methods || ['TELEBIRR', 'CBEBIRR', 'BANK_TRANSFER']).includes('BANK_TRANSFER') && (
              <div
                className={`block border rounded-lg p-4 cursor-pointer transition-colors ${selectedMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/50'}`}
                onClick={() => handleMethodSelection('BANK_TRANSFER')}
              >
                <div className="flex items-center">
                  <Building2 className="w-6 h-6 text-primary mr-3" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">Bank Transfer</h3>
                    <p className="text-sm text-slate-500">{t('payment.upload_manual')}</p>
                  </div>
                  {selectedMethod === 'BANK_TRANSFER' && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            {(selectedMethod === 'TELEBIRR' || selectedMethod === 'CBEBIRR') && (
              <button
                onClick={handleDigitalPayment}
                disabled={processing}
                className="w-full btn btn-primary py-3 flex items-center justify-center"
              >
                {processing ? <LoadingSpinner size="sm" className="mr-2 text-white" /> : <CreditCard className="w-5 h-5 mr-2" />}
                {processing ? t('payment.processing') : t('payment.pay_now')}
              </button>
            )}

            {selectedMethod === 'BANK_TRANSFER' && bankDetails && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                  <p className="font-semibold mb-2">{t('payment.bank_details')}</p>
                  <p>{t('payment.bank')} {bankDetails.bank_name || 'Commercial Bank of Ethiopia'}</p>
                  <p>{t('payment.account')} {bankDetails.account_number || '1000123456789'}</p>
                  <p>{t('payment.account_name')} {bankDetails.account_name || 'ACPS Admin Office'}</p>
                  <p>{t('payment.branch')} {bankDetails.branch || 'Addis Ababa Main'}</p>
                  <p className="text-danger mt-2">{t('payment.reference')} {bankDetails.reference_note || invoice.application_arn}</p>
                </div>
                <FileUploader
                  onUpload={handleBankReceiptUpload}
                  acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                  maxSizeMB={5}
                  label={t('payment.upload_receipt')}
                />
                {processing && <p className="text-center text-sm text-primary animate-pulse">{t('payment.uploading_receipt')}</p>}
              </div>
            )}

            {selectedMethod === 'BANK_TRANSFER' && !bankDetails && processing && (
              <div className="text-center py-4">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-slate-500 mt-2">{t('payment.getting_bank')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};