import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const VerifyPermitPage: React.FC = () => {
  const { t } = useTranslation();
  const { permitNumber: initialPermitNumber } = useParams<{ permitNumber: string }>();
  const [searchInput, setSearchInput] = useState(initialPermitNumber || '');
  const [permitNumber, setPermitNumber] = useState(initialPermitNumber || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permitData, setPermitData] = useState<any>(null);

  useEffect(() => {
    const fetchPermit = async () => {
      try {
        setLoading(true);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setPermitNumber(searchInput.trim());
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] p-4 flex flex-col items-center justify-center bg-slate-50">
      <div className="max-w-lg w-full">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('verify.back_home')}
        </Link>

        <div className="card p-8 mb-6 border border-slate-200 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{t('verify.title')}</h1>
            <p className="text-sm text-slate-500 mt-2">{t('verify.subtitle')}</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder={t('verify.placeholder')} 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field py-3"
              required
            />
            <button type="submit" className="btn btn-primary py-3">
              {t('verify.search')}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="card p-12 text-center border border-slate-200">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-slate-500">{t('verify.verifying')} {permitNumber}...</p>
          </div>
        ) : error ? (
          <div className="card border-danger/50 p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('verify.not_found')}</h2>
            <p className="text-slate-600">{error}</p>
          </div>
        ) : permitData ? (
          <div className="card border-primary p-8 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" style={{ backgroundColor: permitData.status === 'ACTIVE' ? '#16a34a' : '#d62828' }} />
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 mt-4 ${
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

            <div className="bg-slate-50 rounded-xl p-6 space-y-4 text-left border border-slate-100 shadow-inner">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-primary mr-4" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('verify.issue_date')}</p>
                  <p className="text-slate-800 font-medium">{permitData.issue_date || t('verify.na')}</p>
                </div>
              </div>
              
              <div className="w-full h-px bg-slate-200" />
              
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary mr-4" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('verify.expiry_date')}</p>
                  <p className="text-slate-800 font-medium">{permitData.expiry_date || t('verify.na')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
