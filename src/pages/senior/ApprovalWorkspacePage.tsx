import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { approvalsApi } from '@/services/api/approvals';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, CheckSquare,
  Building, Users, Clock, MessageSquare, Download, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

type ActionModal = null | 'consent' | 'permit' | 'reject' | 'sendback';

export const ApprovalWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'comments' | 'history'>('details');
  const [modal, setModal] = useState<ActionModal>(null);
  const [submitting, setSubmitting] = useState(false);

  // Action form state
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCitation, setRejectCitation] = useState('');
  const [sendbackInstructions, setSendbackInstructions] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await approvalsApi.getDetail(id!);
        setAppData(data);
      } catch {
        toast.error('Failed to load application');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleIssueConsent = async () => {
    setSubmitting(true);
    try {
      await approvalsApi.issueConsent(id!);
      toast.success('Planning consent issued — applicant notified');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to issue consent');
    } finally { setSubmitting(false); }
  };

  const handleIssuePermit = async () => {
    setSubmitting(true);
    try {
      await approvalsApi.issuePermit(id!);
      toast.success('Construction permit issued — permit PDF generated');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to issue permit');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 50) { toast.error('Rejection reason must be at least 50 characters'); return; }
    if (!rejectCitation.trim()) { toast.error('Regulation citation is required'); return; }
    setSubmitting(true);
    try {
      await approvalsApi.rejectFinal(id!, { reason: rejectReason, regulation_citation: rejectCitation });
      toast.success('Application rejected — applicant notified');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to reject');
    } finally { setSubmitting(false); }
  };

  const handleSendBack = async () => {
    if (sendbackInstructions.trim().length < 20) { toast.error('Please provide clear instructions (min 20 chars)'); return; }
    setSubmitting(true);
    try {
      await approvalsApi.sendBackToReviewer(id!, { instructions: sendbackInstructions });
      toast.success('Sent back to technical reviewer');
      navigate('/senior/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to send back');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!appData) return <div className="p-8 text-slate-500">Application not found</div>;

  const docs = appData.documents || [];
  const comments = appData.comments || [];
  const history = appData.timeline || appData.history || [];
  const neighbors = appData.neighbors || [];
  const consentIssued = appData.status === 'CONSENT_ISSUED' || appData.status === 'PERMIT_ISSUED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/senior/dashboard" className="text-slate-400 hover:text-primary mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{t('senior.final_approval')} {appData.arn}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {appData.applicant_name} · {t('senior.cat')} {appData.building_category} · {appData.intended_use}
          </p>
        </div>
        <StatusBadge status={appData.status} size="md" />
      </div>

      {/* Reviewer recommendation banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <CheckSquare className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">{t('senior.sign_off')}</p>
          <p className="text-sm text-green-700 mt-0.5">
            {t('senior.reviewed_by')} <strong>{appData.reviewer_name || t('senior.assigned_officer')}</strong>.
            {t('senior.sign_off_desc')}
            {t('senior.recommendation')}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="card p-5 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-semibold text-slate-600 mr-1">{t('senior.actions_label')}</span>

        {!consentIssued && (
          <button
            onClick={() => setModal('consent')}
            className="btn text-sm py-2 px-4 bg-green-600 text-white hover:bg-green-700 font-medium rounded-xl gap-2"
          >
            <CheckCircle className="w-4 h-4" /> {t('senior.issue_consent')}
          </button>
        )}

        {consentIssued && (
          <button
            onClick={() => setModal('permit')}
            className="btn text-sm py-2 px-4 bg-primary text-white hover:bg-primary/90 font-medium rounded-xl gap-2"
          >
            <FileText className="w-4 h-4" /> {t('senior.issue_permit')}
          </button>
        )}

        <button
          onClick={() => setModal('sendback')}
          className="btn btn-outline text-sm py-2 px-4 gap-2"
        >
          <Send className="w-4 h-4" /> {t('senior.send_back')}
        </button>

        <button
          onClick={() => setModal('reject')}
          className="btn btn-outline text-danger border-danger hover:bg-danger/10 text-sm py-2 px-4 gap-2"
        >
          <XCircle className="w-4 h-4" /> {t('senior.reject_app')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto w-fit">
        {([
          { key: 'details', label: t('senior.details'), icon: Building },
          { key: 'documents', label: `${t('senior.documents')} (${docs.length})`, icon: FileText },
          { key: 'comments', label: `${t('senior.comments')} (${comments.length})`, icon: MessageSquare },
          { key: 'history', label: t('senior.history'), icon: Clock },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {/* Details */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 border-b pb-2">{t('senior.building_info')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {[
                  [t('senior.applicant'), appData.applicant_name],
                  [t('senior.category'), `${t('senior.category')} ${appData.building_category}`],
                  [t('senior.intended_use'), appData.intended_use],
                  [t('senior.project_value'), `${(appData.project_value_etb || 0).toLocaleString()} ETB`],
                  [t('senior.address'), appData.plot_address],
                  [t('senior.subcity_woreda'), `${appData.subcity_id} / ${appData.woreda}`],
                  [t('senior.height_area'), `${appData.height_m}m / ${appData.floor_area_sqm} sqm`],
                  [t('senior.floors_above_below'), `${appData.floors_above} / ${appData.floors_below}`],
                  [t('senior.architect'), `${appData.architect_name} (${appData.architect_license})`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="font-medium text-slate-800 mt-0.5">{val || t('senior.na')}</p>
                  </div>
                ))}
              </div>
            </div>

            {neighbors.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 border-b pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> {t('senior.neighbor_consents')} ({neighbors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {neighbors.map((n: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{n.neighbor_name}</p>
                        <p className="text-xs text-slate-500">{n.neighbor_phone}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{n.status || 'SUBMITTED'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            {docs.length === 0 && <p className="text-slate-400 italic text-sm">{t('senior.no_docs')}</p>}
            {docs.map((doc: any) => (
              <div key={doc.document_id} className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{doc.document_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{doc.file_name} · v{doc.version_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    doc.validation_status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    doc.validation_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {doc.validation_status || t('senior.pending')}
                  </span>
                  <button className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-3">
            {comments.length === 0 && <p className="text-slate-400 italic text-sm">{t('senior.no_comments')}</p>}
            {comments.map((c: any) => (
              <div
                key={c.comment_id}
                className={`rounded-xl border p-4 ${
                  c.resolution_status === 'OPEN' ? 'bg-orange-50 border-orange-200' :
                  'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.resolution_status === 'OPEN' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {c.category} · {c.resolution_status}
                  </span>
                  <span className="text-xs text-slate-400">{c.author_name}</span>
                </div>
                <p className="text-slate-700 text-sm">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-4 pl-4 border-l-2 border-slate-200 ml-2 py-2">
            {history.length === 0 && <p className="text-slate-400 italic text-sm">{t('senior.no_history')}</p>}
            {history.map((event: any, idx: number) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                <p className="text-xs text-slate-400 mb-1">
                  {format(parseISO(event.created_at), 'PPp')} · {event.actor_name}
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800 text-sm">
                    {t('senior.status_arrow')} <span className="text-primary">{event.new_status}</span>
                  </p>
                  {event.note && <p className="text-xs text-slate-500 mt-1">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Issue Consent confirm */}
      {modal === 'consent' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t('senior.issue_consent_q')}</h2>
              <p className="text-slate-500 text-sm mt-2">{t('senior.issue_consent_desc')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('senior.cancel')}</button>
              <button onClick={handleIssueConsent} disabled={submitting} className="btn flex-1 bg-green-600 text-white hover:bg-green-700 font-medium rounded-xl py-2.5">
                {submitting ? t('senior.issuing') : t('senior.issue_consent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Permit confirm */}
      {modal === 'permit' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t('senior.issue_permit_q')}</h2>
              <p className="text-slate-500 text-sm mt-2">{t('senior.issue_permit_desc')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('senior.cancel')}</button>
              <button onClick={handleIssuePermit} disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? t('senior.issuing') : t('senior.issue_permit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {modal === 'reject' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('senior.reject_app')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('senior.reject_app_desc')}</p>
            <div className="space-y-4">
              <div>
                <label className="label">{t('senior.rejection_reason')} <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder={t('senior.reject_placeholder')}
                  className="input-field"
                />
                <p className={`text-xs mt-1 ${rejectReason.length < 50 ? 'text-orange-500' : 'text-green-600'}`}>
                  {rejectReason.length}/50 {t('senior.chars_min')}
                </p>
              </div>
              <div>
                <label className="label">{t('senior.regulation_citation')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={rejectCitation}
                  onChange={e => setRejectCitation(e.target.value)}
                  placeholder={t('senior.citation_placeholder')}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('senior.cancel')}</button>
              <button onClick={handleReject} disabled={submitting} className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-xl py-2.5">
                {submitting ? t('senior.rejecting') : t('senior.confirm_rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send back modal */}
      {modal === 'sendback' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('senior.send_back')}</h2>
            <p className="text-sm text-slate-500 mb-4">{t('senior.send_back_desc')}</p>
            <div>
              <label className="label">{t('senior.instructions_reviewer')} <span className="text-red-500">*</span></label>
              <textarea
                value={sendbackInstructions}
                onChange={e => setSendbackInstructions(e.target.value)}
                rows={4}
                placeholder={t('senior.instructions_placeholder')}
                className="input-field"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('senior.cancel')}</button>
              <button onClick={handleSendBack} disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? t('senior.sending') : t('senior.send_back_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
