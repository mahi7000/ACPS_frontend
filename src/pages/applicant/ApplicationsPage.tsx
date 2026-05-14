import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export const ApplicationsPage: React.FC = () => {
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
      header: 'ARN',
      accessorKey: 'arn',
      cell: (item) => <span className="font-medium text-primary">{item.arn || 'Pending'}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'building_category',
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Created Date',
      cell: (item) => format(new Date(item.created_at), 'MMM dd, yyyy'),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-3">
          <Link to={`/applicant/applications/${item.application_id}`} className="text-highlight hover:text-highlight/80 font-medium text-sm">
            View Details
          </Link>
          {(item.status === 'PAYMENT_PENDING' || item.status === 'PAYMENT_EXPIRED') && (
            <Link to={`/applicant/payment/${item.application_id}`} className="text-primary hover:text-primary/80 font-medium text-sm">
              Pay Fees
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-primary">My Applications</h1>
        <Link to="/applicant/applications/new" className="btn btn-primary">
          <PlusCircle className="w-5 h-5 mr-2" />
          New Application
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
              placeholder="Search by ARN..."
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
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVISION_REQUIRED">Revision Required</option>
              <option value="PERMIT_ISSUED">Permit Issued</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <DataTable data={filteredApps} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
