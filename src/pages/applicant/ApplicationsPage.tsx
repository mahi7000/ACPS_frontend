import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export const ApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await applicationsApi.getAll({ status: statusFilter || undefined });
        setApplications(res.results || res);
      } catch (err) {
        console.error('Failed to fetch apps', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [statusFilter]);

  const filteredApps = applications.filter((app) =>
    (app.arn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<any>[] = [
    {
      header: t('dashboard.arn'),
      accessorKey: 'arn',
      cell: (item) => <span className="font-medium text-primary">{item.arn || t('dashboard.pending')}</span>,
    },
    {
      header: t('dashboard.category'),
      accessorKey: 'building_category',
    },
    {
      header: t('dashboard.status'),
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: t('applications.created_date'),
      cell: (item) => format(new Date(item.created_at), 'MMM dd, yyyy'),
    },
    {
      header: t('dashboard.actions'),
      cell: (item) => (
        <div className="flex space-x-3">
          <Link to={`/applicant/applications/${item.application_id}`} className="text-highlight hover:text-highlight/80 font-medium text-sm">
            {t('dashboard.view_details')}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary">{t('applications.my_applications')}</h1>
        <Link to="/applicant/applications/new" className="btn btn-primary">
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('applications.new_application')}
        </Link>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t('applications.search_arn')}
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('applications.all_statuses')}</option>
              <option value="DRAFT">{t('applications.draft')}</option>
              <option value="PAYMENT_PENDING">{t('applications.payment_pending')}</option>
              <option value="UNDER_REVIEW">{t('applications.under_review')}</option>
              <option value="REVISION_REQUIRED">{t('applications.revision_required')}</option>
              <option value="PERMIT_ISSUED">{t('applications.permit_issued')}</option>
              <option value="COMPLETED">{t('applications.completed')}</option>
            </select>
          </div>
        </div>

        <DataTable data={filteredApps} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
