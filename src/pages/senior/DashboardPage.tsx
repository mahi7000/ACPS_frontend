import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { approvalsApi } from '@/services/api/approvals';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import {
  ClipboardCheck, FileSignature, AlertCircle, TrendingUp, Clock,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export const SeniorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await approvalsApi.getQueue();
        const raw = res.results || res || [];
        setQueue(raw);
      } catch (err) {
        console.error('Failed to fetch approval queue', err);
        setQueue([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const permitApprovals = queue.filter(a => a.status === 'AWAITING_SENIOR_APPROVAL');
  const completionReviews = queue.filter(a => a.status === 'COMPLETION_DECLARED');
  const flagged = queue.filter(a => (a.revision_cycle || 0) > 3);

  // Average days open
  const avgDays = queue.length
    ? Math.round(queue.reduce((sum, a) => sum + differenceInDays(new Date(), parseISO(a.created_at)), 0) / queue.length)
    : 0;

  const permitColumns: ColumnDef<any>[] = [
    { header: 'ARN', cell: (i) => <span className="font-mono font-semibold text-primary text-sm">{i.arn}</span> },
    {
      header: 'Category',
      cell: (i) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          i.building_category === 'C' ? 'bg-red-100 text-red-700' :
          i.building_category === 'B' ? 'bg-orange-100 text-orange-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          Cat {i.building_category}
        </span>
      ),
    },
    { header: 'Applicant', cell: (i) => i.applicant_name || 'N/A' },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    {
      header: 'Days Open',
      cell: (i) => {
        const d = differenceInDays(new Date(), parseISO(i.created_at));
        return <span className={`font-semibold ${d > 21 ? 'text-red-600' : d > 10 ? 'text-orange-500' : 'text-slate-700'}`}>{d}d</span>;
      },
    },
    { header: 'Submitted', cell: (i) => format(parseISO(i.updated_at || i.created_at), 'MMM dd, yyyy') },
    {
      header: 'Actions',
      cell: (i) => (
        <Link
          to={i.status === 'COMPLETION_DECLARED'
            ? `/senior/completion-review/${i.application_id}`
            : `/senior/applications/${i.application_id}`}
          className="btn btn-primary text-xs py-1.5 px-3"
        >
          Review
        </Link>
      ),
    },
  ];

  const flaggedColumns: ColumnDef<any>[] = [
    { header: 'ARN', cell: (i) => <span className="font-mono font-semibold text-primary">{i.arn}</span> },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    {
      header: 'Revisions',
      cell: (i) => (
        <span className="flex items-center gap-1 text-red-600 font-bold">
          <AlertCircle className="w-4 h-4" /> {i.revision_cycle}
        </span>
      ),
    },
    {
      header: '',
      cell: (i) => (
        <Link to={`/senior/applications/${i.application_id}`} className="text-primary hover:underline text-sm font-medium">
          Escalate
        </Link>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Senior Approving Officer Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve applications recommended by technical officers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card p-5 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Permits</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{permitApprovals.length}</h3>
              <p className="text-xs text-slate-400 mt-1">awaiting approval</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FileSignature className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-yellow-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Certificates</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{completionReviews.length}</h3>
              <p className="text-xs text-slate-400 mt-1">to issue</p>
            </div>
            <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl"><ClipboardCheck className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged (&gt;3 revisions)</p>
              <h3 className="text-3xl font-bold text-red-600 mt-1">{flagged.length}</h3>
              <p className="text-xs text-slate-400 mt-1">need escalation</p>
            </div>
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-slate-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Days Open</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{avgDays}</h3>
              <p className="text-xs text-slate-400 mt-1">across all queue</p>
            </div>
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Flagged applications */}
      {flagged.length > 0 && (
        <div className="card p-6 border border-red-200 bg-red-50">
          <h2 className="text-base font-bold text-red-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Flagged Applications — Excess Revision Cycles
          </h2>
          <DataTable data={flagged} columns={flaggedColumns} />
        </div>
      )}

      {/* Permit approval queue */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Approval Queue
        </h2>
        <DataTable data={[...permitApprovals, ...completionReviews]} columns={permitColumns} loading={loading} />
      </div>
    </div>
  );
};
