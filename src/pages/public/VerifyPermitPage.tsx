import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const VerifyPermitPage: React.FC = () => {
  const { permitNumber } = useParams<{ permitNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permitData, setPermitData] = useState<any>(null);

  useEffect(() => {
    const fetchPermit = async () => {
      try {
        setLoading(true);
        // The spec specifies this as a public endpoint, we just use the apiClient which handles URL
        // However, we might not have a token. The backend should handle it if it's public.
        const response = await apiClient.get(`/permits/${permitNumber}/`);
        setPermitData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Permit not found or an error occurred.');
        setPermitData(null);
      } finally {
        setLoading(false);
      }
    };

    if (permitNumber) {
      fetchPermit();
    }
  }, [permitNumber]);

  return (
    <div className="min-h-[calc(100vh-140px)] p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {loading ? (
          <div className="card p-12 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-500">Verifying permit {permitNumber}...</p>
          </div>
        ) : error ? (
          <div className="card border-danger/50 p-8 text-center">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Permit Not Found</h2>
            <p className="text-slate-600 mb-6">{error}</p>
          </div>
        ) : permitData ? (
          <div className="card border-primary p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              permitData.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-danger/10 text-danger'
            }`}>
              {permitData.status === 'ACTIVE' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{permitData.permit_number}</h2>
            
            <div className="inline-block px-4 py-1 rounded-full text-sm font-semibold tracking-wider mb-8 uppercase" style={{
              backgroundColor: permitData.status === 'ACTIVE' ? '#16a34a' : '#d62828',
              color: 'white'
            }}>
              {permitData.status}
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4 text-left border border-slate-100">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-primary mr-4" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Issue Date</p>
                  <p className="text-slate-800 font-medium">{permitData.issue_date}</p>
                </div>
              </div>
              
              <div className="w-full h-px bg-slate-200" />
              
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary mr-4" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Expiry Date</p>
                  <p className="text-slate-800 font-medium">{permitData.expiry_date}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
