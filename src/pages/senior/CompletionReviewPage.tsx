import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { approvalsApi } from '@/services/api/approvals';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  ArrowLeft, CheckCircle, XCircle, MapPin, Camera, FileText,
  AlertTriangle, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export const CompletionReviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await approvalsApi.getCompletionReview(applicationId!);
        setReviewData(data);
      } catch {
        toast.error('Failed to load completion review data');
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  const handleIssueCertificate = async () => {
    setSubmitting(true);
    try {
      await approvalsApi.issueCompletionCertificate(applicationId!);
      toast.success('Completion Certificate issued — applicant notified');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to issue certificate');
    } finally { setSubmitting(false); }
  };

  const handleRejectCompletion = async () => {
    if (rejectReason.trim().length < 20) { toast.error('Please provide a detailed reason (min 20 characters)'); return; }
    setSubmitting(true);
    try {
      await approvalsApi.rejectCompletion(applicationId!, { reason: rejectReason });
      toast.success('Completion rejected — applicant and inspector notified');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to reject completion');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!reviewData) return <div className="p-8 text-slate-500">Data not found</div>;

  const inspection = reviewData.final_inspection || reviewData.inspection || {};
  const photos = inspection.photos || reviewData.photos || [];
  const approvedDocs = reviewData.approved_documents || reviewData.documents || [];
  const checklistItems = inspection.checklist_items || [];

  const passed = checklistItems.filter((i: any) => i.result === 'PASS').length;
  const failed = checklistItems.filter((i: any) => i.result === 'FAIL').length;
  const naItems = checklistItems.filter((i: any) => i.result === 'NA').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/senior/dashboard" className="text-slate-400 hover:text-primary mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{t('senior.completion_review')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            ARN: <strong>{reviewData.application_arn}</strong> ·
            {t('senior.inspector')} <strong>{inspection.inspector_name || t('senior.na')}</strong>
            {inspection.completed_at && ` · ${t('senior.completed_on')} ${format(parseISO(inspection.completed_at), 'MMM dd, yyyy')}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRejectModal(true)}
            className="btn btn-outline text-danger border-danger hover:bg-danger/10 gap-2"
          >
            <XCircle className="w-4 h-4" /> {t('senior.reject')}
          </button>
          <button
            onClick={handleIssueCertificate}
            disabled={submitting}
            className="btn bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl gap-2"
          >
            <CheckCircle className="w-4 h-4" /> {t('senior.issue_cert')}
          </button>
        </div>
      </div>

      {/* Inspection result banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${
        inspection.overall_result === 'PASSED'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        {inspection.overall_result === 'PASSED'
          ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          : <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
        <div>
          <h3 className={`font-bold ${inspection.overall_result === 'PASSED' ? 'text-green-800' : 'text-red-800'}`}>
            {t('senior.final_inspection')} {inspection.overall_result || t('senior.result_pending')}
          </h3>
          <p className={`text-sm mt-0.5 ${inspection.overall_result === 'PASSED' ? 'text-green-700' : 'text-red-700'}`}>
            {inspection.overall_result === 'PASSED'
              ? t('senior.pass_desc')
              : inspection.failure_summary || t('senior.fail_desc')}
          </p>
          <div className="flex gap-4 mt-2 text-xs font-semibold">
            <span className="text-green-700">✓ {passed} {t('senior.pass')}</span>
            <span className="text-red-600">✗ {failed} {t('senior.fail')}</span>
            <span className="text-slate-500">— {naItems} {t('senior.na')}</span>
            <span className="text-slate-500">{checklistItems.length} {t('senior.total_items')}</span>
          </div>
        </div>
      </div>

      {/* Side-by-side: Plans vs Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Approved plans */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> {t('senior.approved_plans')}
          </h2>
          <div className="space-y-3">
            {approvedDocs.length === 0 && (
              <p className="text-slate-400 text-sm italic">{t('senior.no_approved_docs')}</p>
            )}
            {approvedDocs.map((doc: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{doc.document_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">v{doc.version_number} · {doc.file_name}</p>
                  </div>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Site photos */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" /> {t('senior.site_photos')} ({photos.length})
          </h2>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
              <Camera className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">{t('senior.no_photos')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p: any, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  {p.url ? (
                    <img src={p.url} alt={`Site photo ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <MapPin className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-[9px] text-white">
                    {p.gps_lat
                      ? `${Number(p.gps_lat).toFixed(4)}, ${Number(p.gps_lng).toFixed(4)}`
                      : p.timestamp ? format(parseISO(p.timestamp), 'MMM dd, HH:mm') : t('senior.gps_tagged')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checklist Summary */}
      {checklistItems.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">{t('senior.checklist_results')}</h2>
          <div className="space-y-2">
            {checklistItems.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.result === 'PASS' ? 'bg-green-50 border-green-200' :
                  item.result === 'FAIL' ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                }`}
              >
                <p className="text-sm text-slate-700 flex-1">{item.item_text}</p>
                <div className="flex items-center gap-3 shrink-0">
                  {item.notes && <p className="text-xs text-slate-500 max-w-[160px] truncate">{item.notes}</p>}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.result === 'PASS' ? 'bg-green-200 text-green-800' :
                    item.result === 'FAIL' ? 'bg-red-200 text-red-800' :
                    'bg-slate-200 text-slate-600'
                  }`}>{item.result || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('senior.reject_completion_q')}</h2>
            <p className="text-sm text-slate-500 mb-4">{t('senior.reject_completion_desc')}</p>
            <div>
              <label className="label">{t('senior.reason_rejection')} <span className="text-red-500">*</span></label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder={t('senior.reason_placeholder')}
                className="input-field"
              />
              <p className={`text-xs mt-1 ${rejectReason.length < 20 ? 'text-orange-500' : 'text-green-600'}`}>
                {rejectReason.length}/20 {t('senior.chars_min')}
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRejectModal(false)} className="btn btn-outline flex-1">{t('senior.cancel')}</button>
              <button onClick={handleRejectCompletion} disabled={submitting} className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-xl py-2.5">
                {submitting ? t('senior.rejecting') : t('senior.confirm_rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
