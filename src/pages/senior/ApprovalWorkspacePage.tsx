import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { approvalsApi } from '@/services/api/approvals';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ArrowLeft, CheckCircle, XCircle, FileText, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApprovalWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await approvalsApi.getDetail(id!);
        setAppData(data);
      } catch (err) {
        toast.error('Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    try {
      await approvalsApi.issueConsent(id!);
      toast.success('Building consent issued successfully');
      navigate('/senior/dashboard');
    } catch (err) {
      toast.error('Failed to issue consent');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for final rejection:');
    if (!reason) return toast.error('Rejection reason is required');
    try {
      await approvalsApi.rejectFinal(id!, { reason });
      toast.success('Application rejected');
      navigate('/senior/dashboard');
    } catch (err) {
      toast.error('Failed to reject application');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!appData) return <div>Application not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/senior/dashboard" className="text-slate-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Final Approval: {appData.arn}</h1>
          <p className="text-slate-500 text-sm">Reviewer Recommendation: <span className="font-medium text-green-600">Approve</span></p>
        </div>
        <div className="flex-1" />
        <StatusBadge status={appData.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary border-b pb-4 mb-4">Application Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Applicant Name</p><p className="font-medium">{appData.applicant_name}</p></div>
              <div><p className="text-sm text-slate-500">Category</p><p className="font-medium">{appData.building_category}</p></div>
              <div><p className="text-sm text-slate-500">Intended Use</p><p className="font-medium">{appData.intended_use}</p></div>
              <div><p className="text-sm text-slate-500">Project Value</p><p className="font-medium">{appData.project_value_etb} ETB</p></div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary border-b pb-4 mb-4">Technical Review Sign-off</h2>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-start">
              <CheckSquare className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Reviewed by: {appData.reviewer_name || 'Assigned Officer'}</p>
                <p className="text-slate-600 text-sm mt-1">"All architectural and structural documents meet the local building code requirements. I recommend issuing building consent."</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Decision</h2>
            <div className="space-y-3">
              <button onClick={handleApprove} className="btn btn-primary bg-green-600 hover:bg-green-700 w-full py-3 justify-center text-lg">
                <CheckCircle className="w-5 h-5 mr-2" /> Issue Consent
              </button>
              <button onClick={handleReject} className="btn btn-outline text-danger border-danger hover:bg-danger/10 w-full py-3 justify-center text-lg">
                <XCircle className="w-5 h-5 mr-2" /> Reject Application
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Issuing consent will automatically notify the applicant and generate the consent document.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <button className="flex items-center text-primary hover:underline text-sm">
                  <FileText className="w-4 h-4 mr-2" /> View All Documents
                </button>
              </li>
              <li>
                <button className="flex items-center text-primary hover:underline text-sm">
                  <FileText className="w-4 h-4 mr-2" /> View Review History
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
