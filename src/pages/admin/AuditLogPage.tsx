import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AuditLogPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminApi.getAuditLog();
        setLogs(res.results || res);
      } catch (err) {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns: ColumnDef<any>[] = [
    { header: 'Timestamp', cell: (i) => {
        const ts = i.timestamp || i.created_at;
        return ts ? format(new Date(ts), 'MMM dd, yyyy HH:mm:ss') : 'N/A';
    }},
    { header: 'Actor', cell: (i) => (
      <div>
        <p className="font-medium text-slate-800">{i.user_name || i.actor_name || i.user_id || 'System'}</p>
        <p className="text-xs text-slate-500">{i.user_role || i.actor_role || i.role || 'N/A'}</p>
      </div>
    )},
    { header: 'Action', cell: (i) => <span className="font-medium text-primary">{i.action_type || i.action || 'UNKNOWN'}</span> },
    { header: 'Details', cell: (i) => {
      // Pick up known detail keys
      const details = i.details || {};
      const resType = i.resource_type || details.resource_type;
      const resId = i.resource_id || details.resource_id;
      // const oldStat = details.previous_status || details.old_status;
      const newStat = details.new_status;
      
      return (
        <div className="text-xs">
          {resType && <p>Type: <strong>{resType}</strong></p>}
          {resId && <p>ID: {resId}</p>}
          {newStat && <p className="text-green-600">Status ➔ {newStat}</p>}
          {(!resType && !resId && !newStat && Object.keys(details).length > 0) ? (
             <span className="text-slate-400">{JSON.stringify(details).substring(0, 50)}...</span>
          ) : null}
        </div>
      );
    }},
    { header: 'IP Address', accessorKey: 'ip_address' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">System Audit Log</h1>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input type="text" placeholder="Search logs..." className="input-field pl-10" />
          </div>
          <button className="btn btn-outline whitespace-nowrap">
            <Filter className="w-4 h-4 mr-2" /> Filter Options
          </button>
        </div>

        <DataTable data={logs} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
