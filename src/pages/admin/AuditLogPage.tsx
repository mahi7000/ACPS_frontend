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
    { header: 'Timestamp', cell: (i) => i.timestamp ? format(new Date(i.timestamp), 'MMM dd, yyyy HH:mm:ss') : 'N/A' },
    { header: 'Actor', cell: (i) => (
      <div>
        <p className="font-medium text-slate-800">{i.actor_name}</p>
        <p className="text-xs text-slate-500">{i.actor_role}</p>
      </div>
    )},
    { header: 'Action', cell: (i) => <span className="font-medium text-primary">{i.action}</span> },
    { header: 'Resource', cell: (i) => `${i.resource_type} (${i.resource_id})` },
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
