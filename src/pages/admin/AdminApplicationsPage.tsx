import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export const AdminApplicationsPage: React.FC = () => {
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
      header: 'Applicant',
      accessorKey: 'applicant_name', // Assuming API provides this, or use ID
      cell: (item) => item.applicant_name || 'N/A',
    },
    {
      header: 'Category',
      accessorKey: 'building_category',
    },
    {
      header: 'Status',
      cell: (item) => {
        const displayStatus = (item.status === 'AWAITING_ASSIGNMENT' && (item.reviewer_name || item.assigned_officer_id)) ? 'UNDER_REVIEW' : item.status;
        return <StatusBadge status={displayStatus} />;
      },
    },
    {
      header: 'Created Date',
      cell: (item) => item.created_at ? format(new Date(item.created_at), 'MMM dd, yyyy') : 'N/A',
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-3">
          <Link to={`/admin/applications/${item.application_id}`} className="text-highlight hover:text-highlight/80 font-medium text-sm">
            View Details
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">All Applications</h1>
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
              <option value="AWAITING_SENIOR_APPROVAL">Awaiting Senior Approval</option>
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
