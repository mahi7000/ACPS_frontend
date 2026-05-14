import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { UserPlus, Ban, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.results || res);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await adminApi.deactivateUser(id);
        toast.success('User deactivated');
        fetchUsers();
      } catch (err) {
        toast.error('Failed to deactivate user');
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    { header: 'Name', accessorKey: 'full_name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Role', cell: (i) => i.role.replace('_', ' ') },
    { header: 'Status', cell: (i) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${i.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-danger/10 text-danger'}`}>
        {i.status}
      </span>
    )},
    { header: 'Actions', cell: (i) => (
      <button 
        onClick={() => handleDeactivate(i.id)} 
        disabled={i.status !== 'ACTIVE'}
        className="text-danger hover:text-danger/80 p-1 disabled:opacity-50"
      >
        <Ban className="w-4 h-4" />
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner fullPage />;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">User Management</h1>
        <button className="btn btn-primary">
          <UserPlus className="w-5 h-5 mr-2" /> Add Officer
        </button>
      </div>

      <div className="card p-6">
        <div className="flex mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input type="text" placeholder="Search users by name or email..." className="input-field pl-10" />
          </div>
        </div>

        <DataTable data={users} columns={columns} loading={loading} />
      </div>
    </div>
  );
};
