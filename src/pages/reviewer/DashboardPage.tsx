import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewsApi } from '@/services/api/reviews';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import { FileText, Clock, CheckSquare, TrendingUp, AlertTriangle, Flame } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const getSLAColor = (daysOpen: number, revisions: number) => {
  if (daysOpen > 14 || revisions > 3) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Critical', icon: <Flame className="w-3 h-3" /> };
  if (daysOpen > 7) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Warning', icon: <AlertTriangle className="w-3 h-3" /> };
  return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'On Track', icon: <Clock className="w-3 h-3" /> };
};

export const ReviewerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        // Strategy 1: Use the dedicated queue endpoint (returns only this reviewer's apps)
        const res = await reviewsApi.getQueue();
        let raw: any[] = res.results || res || [];

        // Strategy 2: If the queue returns empty (backend bug), fall back to fetching
        // all applications and filtering by the current reviewer's user_id
        if (raw.length === 0 && user?.user_id) {
          console.warn('[Reviewer] Queue empty — falling back to direct application search');
          const fallback = await apiClient.get('/applications/', {
            params: { assigned_officer_id: user.user_id, page_size: 100 }
          });
          const fallbackList = fallback.data?.results || fallback.data || [];
          raw = fallbackList;
        }

        // Sort by urgency: most days open first
        const sorted = [...raw].sort((a: any, b: any) => {
          const da = differenceInDays(new Date(), new Date(a.created_at));
          const db = differenceInDays(new Date(), new Date(b.created_at));
          return db - da;
        });
        setQueue(sorted);
      } catch (err) {
        console.error('Failed to fetch queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [user?.user_id]);

  const totalInQueue = queue.length;
  const critical = queue.filter(a => {
    const d = differenceInDays(new Date(), new Date(a.created_at));
    return d > 14 || (a.revision_cycle || 0) > 3;
  }).length;
  const warning = queue.filter(a => {
    const d = differenceInDays(new Date(), new Date(a.created_at));
    return d > 7 && d <= 14;
  }).length;

  const columns: ColumnDef<any>[] = [
    {
      header: 'ARN',
      accessorKey: 'arn',
      cell: (i) => <span className="font-mono font-semibold text-primary text-sm">{i.arn || 'Pending'}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'building_category',
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
    { header: 'Status', cell: (i) => <StatusBadge status={i.status === 'AWAITING_ASSIGNMENT' ? 'UNDER_REVIEW' : i.status} /> },
    {
      header: 'Days Open',
      cell: (i) => {
        const d = differenceInDays(new Date(), new Date(i.created_at));
        return <span className={`font-semibold ${d > 14 ? 'text-red-600' : d > 7 ? 'text-orange-600' : 'text-slate-700'}`}>{d}d</span>;
      },
    },
    {
      header: 'Revisions',
      cell: (i) => {
        const r = i.revision_cycle || 0;
        return <span className={`font-semibold ${r > 3 ? 'text-red-600' : 'text-slate-700'}`}>{r}</span>;
      },
    },
    {
      header: 'Urgency',
      cell: (i) => {
        const days = differenceInDays(new Date(), new Date(i.created_at));
        const sla = getSLAColor(days, i.revision_cycle || 0);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${sla.bg} ${sla.text} ${sla.border}`}>
            {sla.icon} {sla.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      cell: (i) => (
        <Link to={`/reviewer/applications/${i.application_id}`} className="btn btn-primary text-xs py-1.5 px-3">
          Review
        </Link>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Technical Review Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your assigned applications queue</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          Last updated: {format(new Date(), 'HH:mm')}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card p-5 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Queue</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalInQueue}</h3>
              <p className="text-xs text-slate-400 mt-1">applications assigned</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical</p>
              <h3 className="text-3xl font-bold text-red-600 mt-1">{critical}</h3>
              <p className="text-xs text-slate-400 mt-1">&gt;14 days or &gt;3 revisions</p>
            </div>
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl"><Flame className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-orange-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warning</p>
              <h3 className="text-3xl font-bold text-orange-600 mt-1">{warning}</h3>
              <p className="text-xs text-slate-400 mt-1">7–14 days open</p>
            </div>
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed This Week</p>
              <h3 className="text-3xl font-bold text-green-700 mt-1">—</h3>
              <p className="text-xs text-slate-400 mt-1">from API</p>
            </div>
            <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><CheckSquare className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* SLA legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="font-medium">SLA guide:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> On Track (&lt;7d)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Warning (7–14d)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical (&gt;14d or &gt;3 revisions)</span>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Assigned Applications
          </h2>
        </div>
        <DataTable data={queue} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
