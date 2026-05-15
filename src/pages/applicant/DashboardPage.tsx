import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applicationsApi } from '@/services/api/applications';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileText, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ApplicantDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await applicationsApi.getAll();
        setApplications(data.results || data);
      } catch (error) {
        console.error('Failed to fetch applications', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingApps = applications.filter(a => ['DRAFT', 'PAYMENT_PENDING', 'REVISION_REQUIRED'].includes(a.status)).length;
  const inProgressApps = applications.filter(a => ['UNDER_REVIEW', 'AWAITING_ASSIGNMENT', 'AWAITING_SENIOR_APPROVAL'].includes(a.status)).length;
  const approvedApps = applications.filter(a => ['PERMIT_ISSUED', 'CONSENT_ISSUED', 'COMPLETED'].includes(a.status)).length;

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{t('dashboard.welcome')}, {user?.full_name}</h1>
        <Link to="/applicant/applications/new" className="btn btn-primary">
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('dashboard.new_application')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-highlight">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.action_required')}</p>
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
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.in_review')}</p>
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
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.approved')}</p>
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
          <h2 className="text-lg font-bold text-primary">{t('dashboard.recent_applications')}</h2>
          <Link to="/applicant/applications" className="text-sm font-medium text-primary hover:underline">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{t('dashboard.arn')}</th>
                <th className="px-6 py-4">{t('dashboard.category')}</th>
                <th className="px-6 py-4">{t('dashboard.status')}</th>
                <th className="px-6 py-4">{t('dashboard.created')}</th>
                <th className="px-6 py-4 text-right">{t('dashboard.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.slice(0, 5).map((app) => (
                <tr key={app.application_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-primary">{app.arn || t('dashboard.pending')}</td>
                  <td className="px-6 py-4">{t('dashboard.category')} {app.building_category}</td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4">{format(new Date(app.created_at), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 text-right space-x-2">

                    <Link to={`/applicant/applications/${app.application_id}`} className="text-highlight hover:text-highlight/80 font-medium">
                      {t('dashboard.view_details')}
                    </Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t('dashboard.no_applications')}
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