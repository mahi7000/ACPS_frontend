import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectionsApi } from '@/services/api/inspections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import { CalendarDays, MapPin, CheckCircle2, Clock, XCircle, List } from 'lucide-react';
import { format, differenceInHours, isPast, parseISO } from 'date-fns';

const Countdown: React.FC<{ date: string }> = ({ date }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const hours = differenceInHours(parseISO(date), now);
  if (hours <= 0) return <span className="text-red-600 font-semibold">Now / Overdue</span>;
  if (hours < 24) return <span className="text-orange-600 font-semibold">In {hours}h</span>;
  const days = Math.floor(hours / 24);
  return <span className="text-primary font-semibold">In {days}d</span>;
};

export const InspectorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    (async () => {
      try {
        const res = await inspectionsApi.getSchedule();
        setSchedule(res.results || res);
      } catch (err) {
        console.error('Failed to fetch schedule', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = schedule.filter(i => !isPast(parseISO(i.scheduled_date || new Date().toISOString())) || i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS');
  const past = schedule.filter(i => i.status === 'COMPLETED' || i.status === 'FAILED');
  const todayCount = schedule.filter(i => {
    const today = new Date().toISOString().split('T')[0];
    return i.scheduled_date?.startsWith(today);
  }).length;
  const passedCount = past.filter(i => i.overall_result === 'PASSED').length;
  const failedCount = past.filter(i => i.overall_result === 'FAILED').length;

  const nextInspection = upcoming.sort((a, b) =>
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  )[0];

  const upcomingColumns: ColumnDef<any>[] = [
    {
      header: 'Type',
      cell: (i) => (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
          {i.inspection_type?.replace(/_/g, ' ')}
        </span>
      ),
    },
    { header: 'ARN', cell: (i) => <span className="font-mono text-sm text-primary font-semibold">{i.application_arn || '—'}</span> },
    {
      header: 'Location',
      cell: (i) => (
        <span className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {i.subcity_id ? `${i.subcity_id} / ${i.woreda}` : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Scheduled',
      cell: (i) => i.scheduled_date
        ? format(parseISO(i.scheduled_date), 'EEE, MMM dd yyyy · HH:mm')
        : 'TBD',
    },
    {
      header: 'Countdown',
      cell: (i) => i.scheduled_date ? <Countdown date={i.scheduled_date} /> : '—',
    },
    {
      header: 'Status',
      cell: (i) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          i.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-700' :
          i.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>{i.status}</span>
      ),
    },
    {
      header: 'Action',
      cell: (i) => (
        <Link to={`/inspector/inspections/${i.inspection_id}`} className="btn btn-primary text-xs py-1.5 px-3">
          Open
        </Link>
      ),
    },
  ];

  const pastColumns: ColumnDef<any>[] = [
    { header: 'Type', cell: (i) => <span className="text-sm font-medium">{i.inspection_type?.replace(/_/g, ' ')}</span> },
    { header: 'ARN', cell: (i) => <span className="font-mono text-sm text-primary">{i.application_arn || '—'}</span> },
    { header: 'Date', cell: (i) => i.scheduled_date ? format(parseISO(i.scheduled_date), 'MMM dd, yyyy') : '—' },
    {
      header: 'Outcome',
      cell: (i) => (
        <span className={`flex items-center gap-1 font-semibold text-sm ${
          i.overall_result === 'PASSED' ? 'text-green-600' : 'text-red-600'
        }`}>
          {i.overall_result === 'PASSED'
            ? <><CheckCircle2 className="w-4 h-4" /> Passed</>
            : <><XCircle className="w-4 h-4" /> Failed</>}
        </span>
      ),
    },
    {
      header: '',
      cell: (i) => (
        <Link to={`/inspector/inspections/${i.inspection_id}`} className="text-primary hover:underline text-sm">
          View Report
        </Link>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Site Inspector Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card p-5 border-l-4 border-yellow-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{todayCount}</h3>
              <p className="text-xs text-slate-400 mt-1">scheduled today</p>
            </div>
            <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl"><CalendarDays className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{upcoming.length}</h3>
              <p className="text-xs text-slate-400 mt-1">pending inspections</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Passed</p>
              <h3 className="text-3xl font-bold text-green-700 mt-1">{passedCount}</h3>
              <p className="text-xs text-slate-400 mt-1">total passed</p>
            </div>
            <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</p>
              <h3 className="text-3xl font-bold text-red-600 mt-1">{failedCount}</h3>
              <p className="text-xs text-slate-400 mt-1">total failed</p>
            </div>
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl"><XCircle className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Next Inspection Banner */}
      {nextInspection && (
        <div className="card p-5 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-white rounded-xl">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-wider">Next Inspection</p>
                <p className="font-bold text-slate-800 text-lg mt-0.5">
                  {nextInspection.inspection_type?.replace(/_/g, ' ')} — {nextInspection.application_arn}
                </p>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {nextInspection.subcity_id} / {nextInspection.woreda} ·{' '}
                  {nextInspection.scheduled_date && format(parseISO(nextInspection.scheduled_date), 'EEEE, MMM dd yyyy · HH:mm')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {nextInspection.scheduled_date && <Countdown date={nextInspection.scheduled_date} />}
              </div>
              <Link
                to={`/inspector/inspections/${nextInspection.inspection_id}`}
                className="btn btn-primary text-sm mt-2"
              >
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-6">
        <div className="flex items-center gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            <Clock className="w-4 h-4" /> Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'past' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            <List className="w-4 h-4" /> Past ({past.length})
          </button>
        </div>
        {activeTab === 'upcoming'
          ? <DataTable data={upcoming} columns={upcomingColumns} />
          : <DataTable data={past} columns={pastColumns} />
        }
      </div>
    </div>
  );
};
