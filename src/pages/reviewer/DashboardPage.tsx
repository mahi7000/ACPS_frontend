import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewsApi } from '@/services/api/reviews';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { FileText, Clock, CheckSquare } from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await reviewsApi.getQueue();
        setQueue(res.results || res);
      } catch (err) {
        console.error('Failed to fetch queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const totalInQueue = queue.length;
  const highPriority = queue.filter(a => a.building_category === 'C').length;

  const columns: ColumnDef<any>[] = [
    { header: 'ARN', accessorKey: 'arn', cell: (i) => <span className="font-medium text-primary">{i.arn}</span> },
    { header: 'Category', accessorKey: 'building_category' },
    { header: 'Applicant', cell: (i) => i.applicant_name || 'N/A' },
    { header: 'Status', cell: (i) => <StatusBadge status={i.status} /> },
    { header: 'Actions', cell: (i) => (
      <Link to={`/reviewer/applications/${i.application_id}`} className="btn btn-primary text-xs py-1.5 px-3">
        Review
      </Link>
    )},
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Technical Review Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">My Queue</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalInQueue}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-warning">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">High Priority (Cat C)</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{highPriority}</h3>
            </div>
            <div className="p-3 bg-warning/10 text-warning rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed Today</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">0</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Assigned Applications</h2>
        <DataTable data={queue} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
