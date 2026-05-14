import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { approvalsApi } from '@/services/api/approvals';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { ClipboardCheck, FileSignature, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const SeniorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await approvalsApi.getQueue();
        setQueue(res.results || res);
      } catch (err) {
        console.error('Failed to fetch queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const permitApprovals = queue.filter(a => a.status === 'AWAITING_SENIOR_APPROVAL').length;
  const completionReviews = queue.filter(a => a.status === 'COMPLETION_DECLARED').length;

  const columns: ColumnDef<any>[] = [
    { header: 'ARN', accessorKey: 'arn', cell: (i) => <span className="font-medium text-primary">{i.arn}</span> },
    { header: 'Type', cell: (i) => i.status === 'COMPLETION_DECLARED' ? 'Completion' : 'Permit Issuance' },
    { header: 'Category', accessorKey: 'building_category' },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    { header: 'Submitted', cell: (i) => format(new Date(i.updated_at), 'MMM dd, yyyy') },
    { header: 'Actions', cell: (i) => (
      <Link 
        to={i.status === 'COMPLETION_DECLARED' ? `/senior/completion-review/${i.application_id}` : `/senior/applications/${i.application_id}`} 
        className="btn btn-primary text-xs py-1.5 px-3"
      >
        Review
      </Link>
    )},
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Senior Approving Officer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Permits</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{permitApprovals}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <FileSignature className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-warning">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completion Certificates</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{completionReviews}</h3>
            </div>
            <div className="p-3 bg-warning/10 text-warning rounded-lg">
              <ClipboardCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-danger">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Escalations</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">0</h3>
            </div>
            <div className="p-3 bg-danger/10 text-danger rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Approval Queue</h2>
        <DataTable data={queue} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
