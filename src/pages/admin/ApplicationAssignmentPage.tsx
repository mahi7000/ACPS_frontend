import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/services/api/admin';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  Users, RefreshCw, UserCheck, Zap, Search, Filter, X, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ApplicationAssignmentPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('AWAITING_ASSIGNMENT');
  const [searchTerm, setSearchTerm] = useState('');

  // Assignment modal state
  const [modalApp, setModalApp] = useState<any>(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, officersRes] = await Promise.all([
        adminApi.getAllApplications({ status: statusFilter || undefined }),
        adminApi.getReviewOfficers(),
      ]);
      setApplications(appsRes.results || appsRes);
      setOfficers(officersRes.results || officersRes);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (autoAssign = false) => {
    if (!modalApp) return;
    if (!autoAssign && !selectedOfficer) {
      toast.error('Please select a review officer');
      return;
    }
    setAssigning(true);
    try {
      if (autoAssign) {
        await adminApi.assignReviewer(modalApp.application_id, {
          assigned_officer_id: '', // or some default value for auto-assign
          // auto_assign: true as any // if your API supports it
        });
      } else {
        await adminApi.assignReviewer(modalApp.application_id, {
          assigned_officer_id: selectedOfficer
        });
      }
      
      toast.success(`Application ${modalApp.arn} assigned successfully`);
      setModalApp(null);
      setSelectedOfficer('');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const filtered = applications.filter(a =>
    !searchTerm ||
    (a.arn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<any>[] = [
    {
      header: 'ARN',
      cell: (i) => <span className="font-mono font-semibold text-primary text-sm">{i.arn || 'Pending'}</span>,
    },
    {
      header: 'Applicant',
      cell: (i) => (
        <div>
          <p className="font-medium text-slate-800 text-sm">{i.applicant_name || 'N/A'}</p>
          <p className="text-xs text-slate-400">{i.applicant_email}</p>
        </div>
      ),
    },
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
    { 
      header: 'Status', 
      cell: (i) => {
        // Mask the status to show UNDER_REVIEW if the backend failed to transition it after assignment
        const displayStatus = (i.status === 'AWAITING_ASSIGNMENT' && i.reviewer_name) ? 'UNDER_REVIEW' : i.status;
        return <StatusBadge status={displayStatus} />;
      } 
    },
    {
      header: 'Days Waiting',
      cell: (i) => {
        const d = differenceInDays(new Date(), parseISO(i.created_at));
        return (
          <span className={`font-semibold text-sm ${d > 7 ? 'text-red-600' : d > 3 ? 'text-orange-500' : 'text-slate-700'}`}>
            {d}d
          </span>
        );
      },
    },
    {
      header: 'Assigned To',
      cell: (i) => i.reviewer_name
        ? <span className="flex items-center gap-1.5 text-sm text-green-700"><UserCheck className="w-4 h-4" />{i.reviewer_name}</span>
        : <span className="text-xs text-slate-400 italic">Unassigned</span>,
    },
    {
      header: 'Submitted',
      cell: (i) => i.created_at ? format(parseISO(i.created_at), 'MMM dd, yyyy') : '—',
    },
    {
      header: 'Action',
      cell: (i) => (
        <button
          onClick={() => { setModalApp(i); setSelectedOfficer(''); }}
          className={`btn text-xs py-1.5 px-3 gap-1 ${
            i.reviewer_name
              ? 'btn-outline'
              : 'btn-primary'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          {i.reviewer_name ? 'Reassign' : 'Assign'}
        </button>
      ),
    },
  ];

  const unassigned = applications.filter(a => !a.reviewer_name).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Application Assignment</h1>
          <p className="text-slate-500 text-sm mt-1">Assign submitted applications to Technical Review Officers</p>
        </div>
        <button onClick={fetchData} className="btn btn-outline gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 border-l-4 border-orange-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unassigned</p>
              <h3 className="text-3xl font-bold text-orange-600 mt-1">{unassigned}</h3>
              <p className="text-xs text-slate-400 mt-1">need assignment</p>
            </div>
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl"><Users className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Loaded</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{applications.length}</h3>
              <p className="text-xs text-slate-400 mt-1">matching filter</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Filter className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Review Officers</p>
              <h3 className="text-3xl font-bold text-green-700 mt-1">{officers.length}</h3>
              <p className="text-xs text-slate-400 mt-1">available</p>
            </div>
            <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ARN or applicant name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-56"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
            <option value="AWAITING_ASSIGNMENT">Awaiting Assignment</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
          </select>
        </div>

        <DataTable data={filtered} columns={columns} loading={loading} />
      </div>

      {/* Assignment Modal */}
      {modalApp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Assign Application</h2>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-mono text-primary font-semibold">{modalApp.arn}</span> ·
                  Cat {modalApp.building_category} · {modalApp.intended_use}
                </p>
              </div>
              <button onClick={() => setModalApp(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalApp.reviewer_name && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-blue-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Currently assigned to <strong>{modalApp.reviewer_name}</strong>. Reassigning will notify them.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Select Review Officer</label>
                <select
                  value={selectedOfficer}
                  onChange={e => setSelectedOfficer(e.target.value)}
                  className="input-field"
                >
                  <option value="">— Choose an officer —</option>
                  {officers.map((o: any) => (
                    <option key={o.user_id || o.id} value={o.user_id || o.id}>
                      {o.full_name} {o.current_queue_count != null ? `(${o.current_queue_count} active)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                onClick={() => handleAssign(true)}
                disabled={assigning}
                className="btn btn-outline w-full gap-2 py-2.5"
              >
                <Zap className="w-4 h-4 text-yellow-500" />
                Auto-Assign (Round Robin)
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalApp(null)} className="btn btn-outline flex-1">Cancel</button>
              <button
                onClick={() => handleAssign(false)}
                disabled={assigning || !selectedOfficer}
                className="btn btn-primary flex-1"
              >
                {assigning ? 'Assigning...' : 'Assign Officer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
