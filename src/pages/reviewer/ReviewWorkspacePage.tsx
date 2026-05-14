import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reviewsApi } from '@/services/api/reviews';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ArrowLeft, MessageSquarePlus, CheckCircle, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const ReviewWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState('MISSING_INFO');
  const [selectedDoc, setSelectedDoc] = useState<string>('');

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const data = await reviewsApi.getWorkspace(id!);
        setWorkspace(data);
      } catch (err) {
        toast.error('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspace();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment) return;
    try {
      await reviewsApi.addComment(id!, {
        content: newComment,
        category: commentCategory,
        document: selectedDoc || undefined,
      });
      toast.success('Comment added');
      setNewComment('');
      // Refresh workspace to get new comments
      const data = await reviewsApi.getWorkspace(id!);
      setWorkspace(data);
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDecision = async (decision: 'ACCEPT' | 'REJECT_WITH_COMMENTS') => {
    if (decision === 'REJECT_WITH_COMMENTS' && workspace.comments.filter((c:any) => c.resolution_status === 'OPEN').length === 0) {
      return toast.error('You must add comments before rejecting for revision.');
    }

    try {
      await reviewsApi.submitDecision(id!, { decision });
      toast.success(`Application ${decision === 'ACCEPT' ? 'approved' : 'returned for revision'}`);
      navigate('/reviewer/dashboard');
    } catch (err) {
      toast.error('Failed to submit decision');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!workspace) return <div>Workspace not found</div>;

  const app = workspace.application;
  const docs = workspace.documents || [];
  const comments = workspace.comments || [];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col -m-4 lg:-m-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-4">
          <Link to="/reviewer/dashboard" className="text-slate-500 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Review: {app.arn}</h1>
            <p className="text-xs text-slate-500">Category {app.building_category} | {app.intended_use}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={app.status} />
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button onClick={() => handleDecision('REJECT_WITH_COMMENTS')} className="btn btn-outline text-danger border-danger hover:bg-danger/10 text-sm py-1.5">
            <XCircle className="w-4 h-4 mr-2" /> Request Revision
          </button>
          <button onClick={() => handleDecision('ACCEPT')} className="btn btn-primary bg-green-600 hover:bg-green-700 text-sm py-1.5">
            <CheckCircle className="w-4 h-4 mr-2" /> Recommend Approval
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Documents */}
        <div className="w-2/3 flex flex-col border-r border-slate-200 bg-slate-50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-semibold text-slate-800 mb-2">Documents</h2>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {docs.map((doc: any) => (
                <button
                  key={doc.document_id}
                  onClick={() => setSelectedDoc(doc.document_id)}
                  className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                    selectedDoc === doc.document_id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  {doc.document_type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedDoc ? (
              <div className="w-full h-full bg-white rounded-lg border border-slate-200 shadow-inner flex items-center justify-center">
                {/* In a real app, render PDF or Image viewer here */}
                <p className="text-slate-400 flex flex-col items-center">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  Document Viewer Placeholder
                  <br/>
                  <span className="text-xs mt-2">ID: {selectedDoc}</span>
                </p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a document to view
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Comments */}
        <div className="w-1/3 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Comments & Revisions</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((c: any) => (
              <div key={c.comment_id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{c.category}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.resolution_status === 'OPEN' ? 'bg-warning/20 text-warning' : 'bg-green-100 text-green-700'}`}>
                    {c.resolution_status}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{c.content}</p>
                <p className="text-[10px] text-slate-400 mt-2">Added by {c.author_name}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-slate-500 text-sm mt-8">No comments yet.</p>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <form onSubmit={handleAddComment} className="space-y-3">
              <select 
                value={commentCategory} 
                onChange={e => setCommentCategory(e.target.value)}
                className="input-field text-sm py-1.5"
              >
                <option value="MISSING_INFO">Missing Information</option>
                <option value="DRAWING_ERROR">Drawing Error</option>
                <option value="CODE_NON_COMPLIANCE">Code Non-Compliance</option>
                <option value="CLARIFICATION">Clarification Needed</option>
                <option value="OTHER">Other</option>
              </select>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Type a comment..."
                className="input-field text-sm min-h-[80px]"
                required
              />
              <button type="submit" className="btn btn-primary w-full py-2 text-sm">
                <MessageSquarePlus className="w-4 h-4 mr-2" /> Add Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
