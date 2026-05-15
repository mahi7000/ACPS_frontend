import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewsApi } from '@/services/api/reviews';
import { applicationsApi } from '@/services/api/applications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ArrowLeft, MessageSquarePlus, CheckCircle, XCircle, FileText,
  Download, Users, Building, CheckSquare, AlertTriangle,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { differenceInDays } from 'date-fns';

type DecisionModal = null | 'approve' | 'reject';

export const ReviewWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLeft, setActiveLeft] = useState<'documents' | 'details' | 'neighbors'>('documents');
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [modal, setModal] = useState<DecisionModal>(null);
  const [docRejectModal, setDocRejectModal] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  // Document validation persisted in localStorage (backend has no individual doc validation endpoint)
  const STORAGE_KEY = `doc_validations_${id}`;
  const [localValidations, setLocalValidations] = useState<Record<string, { status: 'ACCEPTED' | 'REJECTED'; notes?: string; savedAt: string }>>(() => {
    try {
      const saved = localStorage.getItem(`doc_validations_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const persistValidation = (docId: string, data: { status: 'ACCEPTED' | 'REJECTED'; notes?: string } | null) => {
    setLocalValidations(prev => {
      const next = { ...prev };
      if (data === null) {
        delete next[docId];
      } else {
        next[docId] = { ...data, savedAt: new Date().toISOString() };
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState('MISSING_INFO');
  const [commentDoc, setCommentDoc] = useState('');

  // Rejection form
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCitation, setRejectCitation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Authenticated file download
  // Per OpenAPI spec, DocumentItem has NO file_url field.
  // We fetch GET /reviews/workspace/{id}/ which may include file URLs inside document objects,
  // OR we try to download via GET /applications/{appId}/documents/{docId}/ with auth.
  const handleDownload = async (doc: any) => {
    const token = localStorage.getItem('accessToken');
    // Check all possible URL fields the backend might return
    const directUrl = doc.file_url || doc.file_path || doc.file || doc.document_url || doc.url || doc.download_url;
    
    const tryFetchAndDownload = async (url: string) => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      // If server returns JSON (metadata), try to find URL inside it
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const fileUrl = json.file_url || json.file_path || json.file || json.document_url;
        if (fileUrl) {
          window.open(fileUrl, '_blank');
          return;
        }
        throw new Error('No file URL in response');
      }
      // Binary file response — trigger download
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = doc.file_name || `document_${doc.document_id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    };

    try {
      if (directUrl) {
        await tryFetchAndDownload(directUrl);
      } else {
        // No direct URL — use the application document endpoint
        const endpoint = `https://acps.onrender.com/api/v1/applications/${id}/documents/${doc.document_id}/`;
        await tryFetchAndDownload(endpoint);
      }
    } catch (err: any) {
      console.warn('Download attempt failed:', err.message);
      // Last resort: open the workspace and let the user see it
      toast.error(`Cannot download "${doc.file_name}" — the backend does not expose a direct file URL for this document.`);
    }
  };

  const handleNeighborDownload = async (neighbor: any) => {
    const token = localStorage.getItem('accessToken');
    // Per spec, NeighborResponse.consent_file is a string (file URL)
    const url = neighbor.consent_file || neighbor.consent_document_url || neighbor.file_url;
    if (!url) {
      toast.error('No consent file URL available');
      return;
    }
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        window.open(url, '_blank'); // Try opening directly if auth not needed
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `consent_${neighbor.neighbor_name || neighbor.neighbor_id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const refresh = async () => {
    try {
      const [appData, commentsRes] = await Promise.all([
        applicationsApi.getById(id!),
        reviewsApi.getComments(id!).catch(() => [])
      ]);

      setWorkspace({
        application: appData,
        documents: appData.documents || [],
        neighbors: appData.neighbors || [],
        comments: commentsRes.results || commentsRes || []
      });
    } catch {
      toast.error('Failed to load workspace data');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await reviewsApi.addComment(id!, {
        content: newComment,
        category: commentCategory,
        document: commentDoc || undefined,
      });
      toast.success('Comment added');
      setNewComment('');
      setCommentDoc('');
      refresh();
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await reviewsApi.resolveComment(id!, commentId, { resolution_status: 'RESOLVED' });
      toast.success('Comment resolved');
      refresh();
    } catch {
      toast.error('Failed to resolve comment');
    }
  };

  // Document validation persisted to localStorage (backend has no individual doc validation endpoint)
  const handleValidateDoc = (docId: string, status: 'ACCEPTED' | 'REJECTED', reason?: string) => {
    if (status === 'REJECTED' && !reason) {
      setDocRejectModal(docId);
      setDocRejectReason('');
      return;
    }
    persistValidation(docId, { status, notes: reason });
    toast.success(`Document marked as ${status === 'ACCEPTED' ? 'Accepted ✓' : 'Rejected ✗'} — saved locally`);
    setDocRejectModal(null);
    setDocRejectReason('');
  };

  const handleClearDocValidation = (docId: string) => {
    persistValidation(docId, null);
    toast('Validation cleared');
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      // OpenAPI spec: ReviewDecisionRequest.decision enum is APPROVED | REJECTED
      await reviewsApi.submitDecision(id!, { decision: 'APPROVED' });
      localStorage.removeItem(STORAGE_KEY); // clear persisted doc decisions on final submit
      toast.success('Application recommended for approval');
      navigate('/reviewer/dashboard');
    } catch {
      toast.error('Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 100) { toast.error('Rejection reason must be at least 100 characters'); return; }
    if (!rejectCitation.trim()) { toast.error('Regulation citation is required'); return; }
    setSubmitting(true);
    try {
      // OpenAPI spec: decision=REJECTED, notes (not rejection_reason), regulation_citation
      await reviewsApi.submitDecision(id!, {
        decision: 'REJECTED',
        notes: rejectReason,
        regulation_citation: rejectCitation,
      });
      localStorage.removeItem(STORAGE_KEY); // clear persisted doc decisions on final submit
      toast.success('Application returned for revision');
      navigate('/reviewer/dashboard');
    } catch {
      toast.error('Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Note: Inspections are auto-scheduled by the backend when the applicant submits
  // POST /applications/{id}/commence/ — the reviewer does NOT schedule inspections.
  // The schedule-inspection endpoint does not exist in the OpenAPI spec.

  if (loading) return <LoadingSpinner fullPage />;
  if (!workspace) return <div>Workspace not found</div>;

  const app = workspace.application || workspace;
  const docs = workspace.documents || [];
  const comments = workspace.comments || [];
  const neighbors = workspace.neighbors || app.neighbors || [];
  const daysOpen = differenceInDays(new Date(), new Date(app.created_at || Date.now()));
  const openComments = comments.filter((c: any) => c.resolution_status === 'OPEN');
  const revCycle = app.revision_cycle || 0;

  // Check if all docs are validated (using local state since backend has no validation endpoint)
  const allDocsValidated = docs.length > 0 && docs.every((d: any) => 
    localValidations[d.document_id]?.status === 'ACCEPTED' || d.validation_status === 'ACCEPTED'
  );
  const pendingDocs = docs.filter((d: any) => 
    !localValidations[d.document_id] && d.validation_status !== 'ACCEPTED'
  ).length;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col -m-6 lg:-m-8">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/reviewer/dashboard" className="text-slate-400 hover:text-primary shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-800 truncate">{t('reviewer.review_title')} {app.arn || t('reviewer.draft')}</h1>
            <p className="text-xs text-slate-500 truncate">
              {t('reviewer.cat')} {app.building_category} · {app.intended_use} · {t('reviewer.open')} {daysOpen}{t('reviewer.d')}
              {revCycle > 3 && <span className="ml-2 text-red-600 font-bold">⚠ {revCycle} {t('reviewer.revisions')}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status === 'AWAITING_ASSIGNMENT' ? 'UNDER_REVIEW' : app.status} />

          <button
            onClick={() => setModal('reject')}
            className="btn btn-outline text-danger border-danger hover:bg-danger/10 text-xs py-1.5 px-3 gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> {t('reviewer.request_revision')}
          </button>

          <button
            onClick={() => setModal('approve')}
            disabled={!allDocsValidated}
            className={`btn text-xs py-1.5 px-3 gap-1 font-medium rounded-lg ${
              allDocsValidated 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={allDocsValidated ? t('reviewer.recommend_approval') : `Accept all ${pendingDocs} pending documents first`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> {t('reviewer.recommend_approval')}
          </button>
        </div>
      </div>

      {revCycle > 3 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2 text-red-700 text-sm shrink-0">
          <AlertTriangle className="w-4 h-4" />
          {t('reviewer.revision_warning', { cycles: revCycle })}
        </div>
      )}

      {/* ── Split Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Pane */}
        <div className="w-[62%] flex flex-col border-r border-slate-200 bg-slate-50">
          {/* Left Tabs */}
          <div className="flex bg-white border-b border-slate-200 px-4 pt-2 gap-1 shrink-0">
            {([
              { key: 'documents', label: t('reviewer.documents'), icon: FileText },
              { key: 'details', label: t('reviewer.app_details'), icon: Building },
              { key: 'neighbors', label: t('reviewer.neighbors'), icon: Users },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveLeft(key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeLeft === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">

            {/* Documents */}
            {activeLeft === 'documents' && (
              <div className="space-y-3">
                {docs.length === 0 && <p className="text-slate-500 text-sm italic">{t('reviewer.no_docs')}</p>}
                {docs.map((doc: any) => (
                  <div
                    key={doc.document_id}
                    className={`bg-white rounded-xl border p-4 transition-all ${
                      selectedDoc === doc.document_id ? 'border-primary shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{doc.document_type?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{doc.file_name} · v{doc.version_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const local = localValidations[doc.document_id];
                          const validStatus = local?.status || doc.validation_status;
                          return (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              validStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                              validStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {validStatus || 'PENDING'}
                            </span>
                          );
                        })()}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 inline-flex"
                          title={t('reviewer.download_doc')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Saved timestamp */}
                    {localValidations[doc.document_id]?.savedAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        {t('reviewer.saved')} {new Date(localValidations[doc.document_id].savedAt).toLocaleString()}
                        {localValidations[doc.document_id].notes && (
                          <span className="ml-2 italic">— "{localValidations[doc.document_id].notes}"</span>
                        )}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => handleValidateDoc(doc.document_id, 'ACCEPTED')}
                        disabled={localValidations[doc.document_id]?.status === 'ACCEPTED'}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> {t('reviewer.accept')}
                      </button>
                      <button
                        onClick={() => handleValidateDoc(doc.document_id, 'REJECTED')}
                        disabled={localValidations[doc.document_id]?.status === 'REJECTED'}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> {t('reviewer.reject')}
                      </button>
                      <button
                        onClick={() => { setSelectedDoc(doc.document_id); setCommentDoc(doc.document_id); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" /> {t('reviewer.comment')}
                      </button>
                      {localValidations[doc.document_id] && (
                        <button
                          onClick={() => handleClearDocValidation(doc.document_id)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 font-medium ml-auto"
                        >
                          ✕ {t('reviewer.clear')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Application Details */}
            {activeLeft === 'details' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">{t('reviewer.app_summary')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    [t('reviewer.applicant'), app.applicant_name],
                    [t('reviewer.cat'), `${t('reviewer.cat')} ${app.building_category}`],
                    [t('reviewer.intended_use'), app.intended_use],
                    [t('reviewer.project_value'), `${(app.project_value_etb || 0).toLocaleString()} ETB`],
                    [t('reviewer.address'), app.plot_address],
                    [t('reviewer.subcity_woreda'), `${app.subcity_id} / ${app.woreda}`],
                    [t('reviewer.height_area'), `${app.height_m}m / ${app.floor_area_sqm} sqm`],
                    [t('reviewer.floors_above_below'), `${app.floors_above} / ${app.floors_below}`],
                    [t('reviewer.architect'), app.architect_name],
                    [t('reviewer.architect_license'), app.architect_license],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="font-medium text-slate-800 text-sm mt-0.5">{val || t('reviewer.na')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neighbors */}
            {activeLeft === 'neighbors' && (
              <div className="space-y-3">
                {neighbors.length === 0 && <p className="text-slate-500 text-sm italic">{t('reviewer.no_neighbors')}</p>}
                {neighbors.map((n: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{n.neighbor_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.neighbor_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{n.status || 'SUBMITTED'}</span>
                      <button
                        onClick={() => handleNeighborDownload(n)}
                        className="p-1.5 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 inline-flex"
                        title={t('reviewer.download_doc')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Comments */}
        <div className="w-[38%] flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-primary" />
              {t('reviewer.comments_revisions')}
              {openComments.length > 0 && (
                <span className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {openComments.length} {t('reviewer.open')}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-center text-slate-400 text-sm mt-8">{t('reviewer.no_comments')}</p>
            )}
            {comments.map((c: any) => (
              <div key={c.comment_id} className={`rounded-xl border p-3 text-sm ${
                c.resolution_status === 'OPEN' ? 'bg-orange-50 border-orange-200' :
                c.resolution_status === 'ESCALATED' ? 'bg-red-50 border-red-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.resolution_status === 'OPEN' ? 'bg-orange-200 text-orange-800' :
                    c.resolution_status === 'ESCALATED' ? 'bg-red-200 text-red-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {c.category} · {c.resolution_status}
                  </span>
                </div>
                <p className="text-slate-700">{c.content}</p>
                {c.document && <p className="text-xs text-slate-400 mt-1">{t('reviewer.on')} {c.document}</p>}
                <p className="text-xs text-slate-400 mt-1">{c.author_name}</p>
                {c.resolution_status === 'OPEN' && (
                  <button
                    onClick={() => handleResolveComment(c.comment_id)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> {t('reviewer.mark_resolved')}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <form onSubmit={handleAddComment} className="space-y-2">
              <select
                value={commentCategory}
                onChange={e => setCommentCategory(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="MISSING_INFO">{t('reviewer.missing_info')}</option>
                <option value="DRAWING_ERROR">{t('reviewer.drawing_error')}</option>
                <option value="CODE_NON_COMPLIANCE">{t('reviewer.code_non_compliance')}</option>
                <option value="CLARIFICATION">{t('reviewer.clarification_needed')}</option>
                <option value="OTHER">{t('reviewer.other')}</option>
              </select>
              {docs.length > 0 && (
                <select
                  value={commentDoc}
                  onChange={e => setCommentDoc(e.target.value)}
                  className="input-field text-sm py-2"
                >
                  <option value="">{t('reviewer.no_specific_doc')}</option>
                  {docs.map((d: any) => (
                    <option key={d.document_id} value={d.document_id}>
                      {d.document_type?.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={t('reviewer.describe_issue')}
                className="input-field text-sm min-h-[80px]"
                required
              />
              <button type="submit" className="btn btn-primary w-full py-2 text-sm gap-2">
                <MessageSquarePlus className="w-4 h-4" /> {t('reviewer.add_comment')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Approve confirm */}
      {modal === 'approve' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t('reviewer.recommend_approval_q')}</h2>
              <p className="text-slate-500 text-sm mt-2">
                {t('reviewer.recommend_desc', { count: docs.filter((d: any) => d.validation_status !== 'ACCEPTED').length })}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('reviewer.cancel')}</button>
              <button onClick={handleApprove} disabled={submitting} className="btn flex-1 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg py-2.5">
                {submitting ? t('reviewer.submitting') : t('reviewer.confirm_approval')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject form */}
      {modal === 'reject' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reviewer.request_revision')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('reviewer.request_revision_desc')}</p>
            <div className="space-y-4">
              <div>
                <label className="label">{t('reviewer.rejection_reason')} <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={5}
                  placeholder={t('reviewer.describe_issues')}
                  className="input-field"
                />
                <p className={`text-xs mt-1 ${rejectReason.length < 100 ? 'text-orange-500' : 'text-green-600'}`}>
                  {rejectReason.length}/100 {t('reviewer.characters')}
                </p>
              </div>
              <div>
                <label className="label">{t('reviewer.regulation_citation')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={rejectCitation}
                  onChange={e => setRejectCitation(e.target.value)}
                  placeholder={t('reviewer.citation_placeholder')}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">{t('reviewer.cancel')}</button>
              <button onClick={handleReject} disabled={submitting} className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg py-2.5">
                {submitting ? t('reviewer.submitting') : t('reviewer.return_revision')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule inspection */}

      {/* Document Rejection Modal */}
      {docRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t('reviewer.reject_doc')}</h2>
            <p className="text-sm text-slate-500 mb-5">{t('reviewer.reject_doc_desc')}</p>
            <div className="space-y-4">
              <div>
                <label className="label">{t('reviewer.rejection_reason')} <span className="text-red-500">*</span></label>
                <textarea
                  value={docRejectReason}
                  onChange={e => setDocRejectReason(e.target.value)}
                  rows={4}
                  placeholder={t('reviewer.describe_doc_issue')}
                  className="input-field"
                  required
                />
                <p className={`text-xs mt-1 ${docRejectReason.length < 50 ? 'text-orange-500' : 'text-green-600'}`}>
                  {docRejectReason.length}/50 {t('reviewer.characters')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDocRejectModal(null); setDocRejectReason(''); }} className="btn btn-outline flex-1">{t('reviewer.cancel')}</button>
              <button 
                onClick={() => handleValidateDoc(docRejectModal, 'REJECTED', docRejectReason)} 
                disabled={docRejectReason.length < 50}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg py-2.5 disabled:opacity-50"
              >
                {t('reviewer.confirm_rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
