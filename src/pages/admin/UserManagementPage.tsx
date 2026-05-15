import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { UserPlus, Ban, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [roleFilter, setRoleFilter] = useState('');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'REVIEW_OFFICER',
    subcity_id: '1',
    initial_password: ''
  });

  // Deactivate Modal state
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deactivateData, setDeactivateData] = useState({
    reason: '',
    reassign_open_applications_to: ''
  });

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

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !deactivateData.reason) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = { reason: deactivateData.reason.trim() };
      if (deactivateData.reassign_open_applications_to.trim()) {
        payload.reassign_open_applications_to = deactivateData.reassign_open_applications_to.trim();
      }
      
      await adminApi.deactivateUser(selectedUserId, payload);
      toast.success('User deactivated successfully');
      setDeactivateModalOpen(false);
      fetchUsers();
      setDeactivateData({ reason: '', reassign_open_applications_to: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOfficer = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    // Build payload without the initial_password if it's empty
    const payload: any = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      subcity_id: formData.subcity_id,
    };
    
    // Only add initial_password if it has a value
    if (formData.initial_password.trim()) {
      payload.initial_password = formData.initial_password;
    }
    
    await adminApi.createOfficer(payload);
    toast.success('Officer created successfully');
    setIsModalOpen(false);
    fetchUsers();
    setFormData({ full_name: '', email: '', phone: '', role: 'REVIEW_OFFICER', subcity_id: '1', initial_password: '' });
  } catch (err) {
    toast.error('Failed to create officer');
  } finally {
    setIsSubmitting(false);
  }
};

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

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
        onClick={() => {
          setSelectedUserId(i.user_id || i.id);
          setDeactivateModalOpen(true);
        }} 
        disabled={i.status !== 'ACTIVE'}
        title="Deactivate User"
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
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-5 h-5 mr-2" /> Add Officer
        </button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="input-field pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="input-field"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="APPLICANT">Applicant</option>
              <option value="REVIEW_OFFICER">Review Officer</option>
              <option value="INSPECTOR">Inspector</option>
              <option value="SENIOR_OFFICER">Senior Officer</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>
        </div>

        <DataTable data={filteredUsers} columns={columns} loading={loading} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Add New Officer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddOfficer} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="input-field" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  className="input-field" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select 
                  className="input-field"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="REVIEW_OFFICER">Review Officer</option>
                  <option value="INSPECTOR">Inspector</option>
                  <option value="SENIOR_OFFICER">Senior Officer</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
              <div>
                <label className="label">Subcity ID</label>
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  value={formData.subcity_id}
                  onChange={(e) => setFormData({...formData, subcity_id: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Initial Password (Optional)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Leave blank for auto-generation"
                  value={formData.initial_password}
                  onChange={(e) => setFormData({...formData, initial_password: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deactivateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Deactivate User</h2>
              <button onClick={() => setDeactivateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeactivate} className="p-6 space-y-4">
              <div>
                <label className="label">Reason for Deactivation</label>
                <textarea 
                  required 
                  className="input-field min-h-[100px]" 
                  placeholder="e.g. Employee resigned"
                  value={deactivateData.reason}
                  onChange={(e) => setDeactivateData({...deactivateData, reason: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Reassign Open Applications To (User ID)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Optional unless user has open assignments"
                  value={deactivateData.reassign_open_applications_to}
                  onChange={(e) => setDeactivateData({...deactivateData, reassign_open_applications_to: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" className="btn btn-outline" onClick={() => setDeactivateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn bg-danger text-white hover:bg-danger/90" disabled={isSubmitting}>
                  {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
