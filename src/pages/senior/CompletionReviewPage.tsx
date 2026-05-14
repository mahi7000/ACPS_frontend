import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { approvalsApi } from '@/services/api/approvals';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, CheckCircle, XCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const CompletionReviewPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<any>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await approvalsApi.getCompletionReview(applicationId!);
        setReviewData(data);
      } catch (err) {
        toast.error('Failed to load completion review data');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [applicationId]);

  const handleIssueCertificate = async () => {
    try {
      await approvalsApi.issueCompletionCertificate(applicationId!);
      toast.success('Completion Certificate issued successfully');
      navigate('/senior/dashboard');
    } catch (err) {
      toast.error('Failed to issue certificate');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!reviewData) return <div>Data not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/senior/dashboard" className="text-slate-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Completion Certificate Review</h1>
          <p className="text-slate-500 text-sm">ARN: {reviewData.application_arn}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary border-b pb-4 mb-4">Final Inspection Report</h2>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" /> Final Inspection Passed
              </h3>
              <p className="text-green-700 text-sm mt-1">
                The assigned site inspector has verified the building matches the approved plans.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Site Photos from Final Inspection</p>
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="aspect-video bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                    <MapPin className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-slate-50 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Action</h2>
            <button onClick={handleIssueCertificate} className="btn btn-primary bg-green-600 hover:bg-green-700 w-full py-3 justify-center text-lg mb-3">
              <CheckCircle className="w-5 h-5 mr-2" /> Issue Certificate
            </button>
            <button className="btn btn-outline text-danger border-danger hover:bg-danger/10 w-full py-3 justify-center text-lg">
              <XCircle className="w-5 h-5 mr-2" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
