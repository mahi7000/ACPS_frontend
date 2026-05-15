import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsApi } from '@/services/api/applications';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileText, PlusCircle, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ApplicantDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await applicationsApi.getAll();
        // Assume data returns an array or paginated response
        setApplications(data.results || data);
      } catch (error) {
        console.error('Failed to fetch applications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handlePayNow = async (applicationId: string) => {
    try {
      const invoice = await applicationsApi.getOrCreateInvoice(applicationId);

      if (invoice?.id || invoice?.invoice_id) {
        navigate(`/applicant/payment/${applicationId}`);
      } else {
        toast.error('Unable to create invoice. Please try again.');
      }
    } catch (error: any) {
      if (error.response?.data?.detail === 'Invoice not found') {
        toast.error('Invoice not found. Please submit your application first.');
      } else {
        toast.error('Failed to process payment. Please try again.');
      }
    }
  };

  const pendingApps = applications.filter(a => ['DRAFT', 'PAYMENT_PENDING', 'REVISION_REQUIRED'].includes(a.status)).length;
  const inProgressApps = applications.filter(a => ['UNDER_REVIEW', 'AWAITING_ASSIGNMENT', 'AWAITING_SENIOR_APPROVAL'].includes(a.status)).length;
  const approvedApps = applications.filter(a => ['PERMIT_ISSUED', 'CONSENT_ISSUED', 'COMPLETED'].includes(a.status)).length;

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Welcome, {user?.full_name}</h1>
        <Link to="/applicant/applications/new" className="btn btn-primary">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Application
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-highlight">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Action Required</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{pendingApps}</h3>
            </div>
            <div className="p-3 bg-highlight/20 text-highlight rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">In Review</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{inProgressApps}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Approved</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{approvedApps}</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary">Recent Applications</h2>
          <Link to="/applicant/applications" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ARN</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.slice(0, 5).map((app) => (
                <tr key={app.application_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-primary">{app.arn || 'Pending'}</td>
                  <td className="px-6 py-4">Category {app.building_category}</td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4">{format(new Date(app.created_at), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {app.status === 'PAYMENT_PENDING' && (
                      <button
                        onClick={() => handlePayNow(app.application_id)}
                        className="text-green-600 hover:text-green-700 font-medium inline-flex items-center"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pay Now
                      </button>
                    )}
                    <Link to={`/applicant/applications/${app.application_id}`} className="text-highlight hover:text-highlight/80 font-medium">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No applications found. Create your first application to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};