import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reviewsApi } from '@/services/api/reviews';
import { applicationsApi } from '@/services/api/applications';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ArrowLeft, MessageSquarePlus, CheckCircle, XCircle, FileText,
  Download, Users, Building, CheckSquare, AlertTriangle, Calendar,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { differenceInDays } from 'date-fns';

type DecisionModal = null | 'approve' | 'reject' | 'schedule';

export const ReviewWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLeft, setActiveLeft] = useState<'documents' | 'details' | 'neighbors'>('documents');
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [modal, setModal] = useState<DecisionModal>(null);
  const [docRejectModal, setDocRejectModal] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  // Local document validation state (no backend endpoint exists for individual doc validation)
  const [localValidations, setLocalValidations] = useState<Record<string, { status: 'ACCEPTED' | 'REJECTED'; notes?: string }>>({});

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState('MISSING_INFO');
  const [commentDoc, setCommentDoc] = useState('');

  // Rejection form
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCitation, setRejectCitation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Schedule inspection form
  const [inspType, setInspType] = useState('FOUNDATION');
  const [inspDate, setInspDate] = useState('');
  const [inspNotes, setInspNotes] = useState('');

  // Authenticated file download (docs require Bearer token)
  const handleDownload = async (doc: any) => {
    const url = doc.file_url || doc.file_path || doc.file || doc.document_url || doc.url || doc.download_url;
    if (!url) {
      // Try constructing download URL from known API pattern
      const token = localStorage.getItem('accessToken');
      const downloadUrl = `https://acps.onrender.com/api/v1/applications/${id}/documents/${doc.document_id}/`;
      try {
        const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = doc.file_name || `document_${doc.document_id}`;
        a.click();
        URL.revokeObjectURL(objUrl);
      } catch {
        toast.error('Cannot download file — URL not available from server');
      }
      return;
    }
    // If we have a direct URL, open it with auth header
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        // Try opening directly if auth not needed (public URL)
        window.open(url, '_blank');
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = doc.file_name || 'document';
      a.click();
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

  // Document validation is local-state only (no backend endpoint exists per API docs)
  const handleValidateDoc = (docId: string, status: 'ACCEPTED' | 'REJECTED', reason?: string) => {
    if (status === 'REJECTED' && !reason) {
      setDocRejectModal(docId);
      setDocRejectReason('');
      return;
    }
    setLocalValidations(prev => ({ ...prev, [docId]: { status, notes: reason } }));
    toast.success(`Document marked as ${status === 'ACCEPTED' ? 'Accepted ✓' : 'Rejected ✗'}`);
    setDocRejectModal(null);
    setDocRejectReason('');
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await reviewsApi.submitDecision(id!, { decision: 'ACCEPT' });
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
      await reviewsApi.submitDecision(id!, {
        decision: 'REJECT_WITH_COMMENTS',
        rejection_reason: rejectReason,
        regulation_citation: rejectCitation,
      });
      toast.success('Application returned for revision');
      navigate('/reviewer/dashboard');
    } catch {
      toast.error('Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!inspDate) { toast.error('Please select an inspection date'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.scheduleInspection(id!, {
        inspection_type: inspType,
        scheduled_date: inspDate,
        notes: inspNotes,
      });
      toast.success('Inspection scheduled successfully');
      setModal(null);
      refresh();
    } catch {
      toast.error('Failed to schedule inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!workspace) return <div>Workspace not found</div>;

  const app = workspace.application || workspace;
  const docs = workspace.documents || [];
  const comments = workspace.comments || [];
  const neighbors = workspace.neighbors || app.neighbors || [];
  const daysOpen = differenceInDays(new Date(), new Date(app.created_at || Date.now()));
  const openComments = comments.filter((c: any) => c.resolution_status === 'OPEN');
  const revCycle = app.revision_cycle || 0;

  const allDocsAccepted = docs.length > 0 && docs.every((d: any) => d.validation_status === 'ACCEPTED');
  const pendingDocs = docs.filter((d: any) => d.validation_status !== 'ACCEPTED').length;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col -m-6 lg:-m-8">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/reviewer/dashboard" className="text-slate-400 hover:text-primary shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-800 truncate">Review: {app.arn || 'Draft'}</h1>
            <p className="text-xs text-slate-500 truncate">
              Cat {app.building_category} · {app.intended_use} · Open {daysOpen}d
              {revCycle > 3 && <span className="ml-2 text-red-600 font-bold">⚠ {revCycle} revision cycles</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status === 'AWAITING_ASSIGNMENT' ? 'UNDER_REVIEW' : app.status} />

          <button
            onClick={() => setModal('schedule')}
            className="btn btn-outline text-xs py-1.5 px-3 gap-1"
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule Inspection
          </button>

          <button
            onClick={() => setModal('reject')}
            className="btn btn-outline text-danger border-danger hover:bg-danger/10 text-xs py-1.5 px-3 gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> Request Revision
          </button>

          <button
            onClick={() => setModal('approve')}
            disabled={!allDocsAccepted}
            className={`btn text-xs py-1.5 px-3 gap-1 font-medium rounded-lg ${
              allDocsAccepted 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={allDocsAccepted ? 'Recommend for approval' : `Accept all ${pendingDocs} pending documents first`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Recommend Approval
          </button>
        </div>
      </div>

      {revCycle > 3 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2 text-red-700 text-sm shrink-0">
          <AlertTriangle className="w-4 h-4" />
          <strong>Warning:</strong> This application has exceeded 3 revision cycles ({revCycle} cycles). Consider escalating.
        </div>
      )}

      {/* ── Split Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Pane */}
        <div className="w-[62%] flex flex-col border-r border-slate-200 bg-slate-50">
          {/* Left Tabs */}
          <div className="flex bg-white border-b border-slate-200 px-4 pt-2 gap-1 shrink-0">
            {([
              { key: 'documents', label: 'Documents', icon: FileText },
              { key: 'details', label: 'App Details', icon: Building },
              { key: 'neighbors', label: 'Neighbors', icon: Users },
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
                {docs.length === 0 && <p className="text-slate-500 text-sm italic">No documents submitted.</p>}
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          doc.validation_status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                          doc.validation_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.validation_status || 'PENDING'}
                        </span>
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
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleValidateDoc(doc.document_id, 'ACCEPTED')}
                        disabled={localValidations[doc.document_id]?.status === 'ACCEPTED'}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleValidateDoc(doc.document_id, 'REJECTED')}
                        disabled={localValidations[doc.document_id]?.status === 'REJECTED'}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => { setSelectedDoc(doc.document_id); setCommentDoc(doc.document_id); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" /> Comment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Application Details */}
            {activeLeft === 'details' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Application Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Applicant', app.applicant_name],
                    ['Category', `Category ${app.building_category}`],
                    ['Intended Use', app.intended_use],
                    ['Project Value', `${(app.project_value_etb || 0).toLocaleString()} ETB`],
                    ['Address', app.plot_address],
                    ['Subcity / Woreda', `${app.subcity_id} / ${app.woreda}`],
                    ['Height / Area', `${app.height_m}m / ${app.floor_area_sqm} sqm`],
                    ['Floors (Above/Below)', `${app.floors_above} / ${app.floors_below}`],
                    ['Architect', app.architect_name],
                    ['Architect License', app.architect_license],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="font-medium text-slate-800 text-sm mt-0.5">{val || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neighbors */}
            {activeLeft === 'neighbors' && (
              <div className="space-y-3">
                {neighbors.length === 0 && <p className="text-slate-500 text-sm italic">No neighbor consents submitted.</p>}
                {neighbors.map((n: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{n.neighbor_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.neighbor_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{n.status || 'SUBMITTED'}</span>
                      {(() => {
                        const url = n.consent_document_url || n.file_url || n.file || n.document_url || null;
                        return url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/5 inline-flex" title="Download consent">
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="p-1.5 text-slate-300 inline-flex cursor-not-allowed" title="Consent file not available">
                            <Download className="w-4 h-4" />
                          </span>
                        );
                      })()}
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
              Comments & Revisions
              {openComments.length > 0 && (
                <span className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {openComments.length} open
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-center text-slate-400 text-sm mt-8">No comments yet. Add one below.</p>
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
                {c.document && <p className="text-xs text-slate-400 mt-1">On: {c.document}</p>}
                <p className="text-xs text-slate-400 mt-1">{c.author_name}</p>
                {c.resolution_status === 'OPEN' && (
                  <button
                    onClick={() => handleResolveComment(c.comment_id)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Mark Resolved
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
                <option value="MISSING_INFO">Missing Information</option>
                <option value="DRAWING_ERROR">Drawing Error</option>
                <option value="CODE_NON_COMPLIANCE">Code Non-Compliance</option>
                <option value="CLARIFICATION">Clarification Needed</option>
                <option value="OTHER">Other</option>
              </select>
              {docs.length > 0 && (
                <select
                  value={commentDoc}
                  onChange={e => setCommentDoc(e.target.value)}
                  className="input-field text-sm py-2"
                >
                  <option value="">No specific document</option>
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
                placeholder="Describe the issue clearly..."
                className="input-field text-sm min-h-[80px]"
                required
              />
              <button type="submit" className="btn btn-primary w-full py-2 text-sm gap-2">
                <MessageSquarePlus className="w-4 h-4" /> Add Comment
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
              <h2 className="text-xl font-bold text-slate-800">Recommend Approval?</h2>
              <p className="text-slate-500 text-sm mt-2">
                This will move the application to <strong>Awaiting Senior Approval</strong>. All {docs.filter((d: any) => d.validation_status !== 'ACCEPTED').length} unvalidated documents will be included.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleApprove} disabled={submitting} className="btn flex-1 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg py-2.5">
                {submitting ? 'Submitting...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject form */}
      {modal === 'reject' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Request Revision</h2>
            <p className="text-sm text-slate-500 mb-5">Provide a detailed reason and cite the relevant regulation.</p>
            <div className="space-y-4">
              <div>
                <label className="label">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={5}
                  placeholder="Describe all issues in detail (min 100 characters)..."
                  className="input-field"
                />
                <p className={`text-xs mt-1 ${rejectReason.length < 100 ? 'text-orange-500' : 'text-green-600'}`}>
                  {rejectReason.length}/100 characters
                </p>
              </div>
              <div>
                <label className="label">Regulation Citation <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={rejectCitation}
                  onChange={e => setRejectCitation(e.target.value)}
                  placeholder="e.g. EBCS 2, Section 4.3.1"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleReject} disabled={submitting} className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg py-2.5">
                {submitting ? 'Submitting...' : 'Return for Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule inspection */}
      {modal === 'schedule' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Schedule Inspection</h2>
            <p className="text-sm text-slate-500 mb-5">An inspector will be notified automatically.</p>
            <div className="space-y-4">
              <div>
                <label className="label">Inspection Type</label>
                <select value={inspType} onChange={e => setInspType(e.target.value)} className="input-field">
                  <option value="FOUNDATION">Foundation</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div>
                <label className="label">Scheduled Date</label>
                <input
                  type="date"
                  value={inspDate}
                  onChange={e => setInspDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea value={inspNotes} onChange={e => setInspNotes(e.target.value)} rows={2} className="input-field" placeholder="Any additional instructions..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleScheduleInspection} disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document Rejection Modal */}
      {docRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Reject Document</h2>
            <p className="text-sm text-slate-500 mb-5">Provide a specific reason for rejecting this document.</p>
            <div className="space-y-4">
              <div>
                <label className="label">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={docRejectReason}
                  onChange={e => setDocRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue with this document (min 50 characters)..."
                  className="input-field"
                  required
                />
                <p className={`text-xs mt-1 ${docRejectReason.length < 50 ? 'text-orange-500' : 'text-green-600'}`}>
                  {docRejectReason.length}/50 characters
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDocRejectModal(null); setDocRejectReason(''); }} className="btn btn-outline flex-1">Cancel</button>
              <button 
                onClick={() => handleValidateDoc(docRejectModal, 'REJECTED', docRejectReason)} 
                disabled={docRejectReason.length < 50}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg py-2.5 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
