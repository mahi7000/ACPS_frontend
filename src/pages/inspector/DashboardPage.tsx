import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectionsApi } from '@/services/api/inspections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { CalendarDays, MapPin, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const InspectorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await inspectionsApi.getSchedule();
        setSchedule(res.results || res);
      } catch (err) {
        console.error('Failed to fetch schedule', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const todayInspections = schedule.filter(i => {
    const today = new Date().toISOString().split('T')[0];
    return i.scheduled_date?.startsWith(today);
  }).length;

  const upcomingInspections = schedule.length - todayInspections;

  const columns: ColumnDef<any>[] = [
    { header: 'Type', accessorKey: 'inspection_type', cell: (i) => i.inspection_type.replace('_', ' ') },
    { header: 'ARN', cell: (i) => <span className="font-medium text-primary">{i.application_arn}</span> },
    { header: 'Location', cell: (i) => i.woreda ? `${i.subcity_id} / ${i.woreda}` : 'N/A' },
    { header: 'Scheduled Date', cell: (i) => i.scheduled_date ? format(new Date(i.scheduled_date), 'MMM dd, yyyy') : 'Pending' },
    { header: 'Status', cell: (i) => <span className={`px-2 py-1 rounded text-xs font-medium ${i.status === 'SCHEDULED' ? 'bg-warning/20 text-warning' : 'bg-green-100 text-green-700'}`}>{i.status}</span> },
    { header: 'Actions', cell: (i) => (
      <Link to={`/inspector/inspections/${i.inspection_id}`} className="btn btn-primary text-xs py-1.5 px-3">
        Workspace
      </Link>
    )},
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Site Inspector Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-warning">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Scheduled Today</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{todayInspections}</h3>
            </div>
            <div className="p-3 bg-warning/10 text-warning rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Upcoming</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{upcomingInspections}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed This Week</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">0</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary mb-4">My Inspection Schedule</h2>
        <DataTable data={schedule} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
