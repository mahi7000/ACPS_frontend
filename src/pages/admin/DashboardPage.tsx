import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api/admin';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Users, Banknote, Activity, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#003049', '#D62828', '#F77F00', '#FCBF49', '#EAE2B7', '#0077B6', '#0096C7'];

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeApplications: 0,
    revenueCollected: 0,
    slaBreaches: 0,
    statusData: [],
    revenueData: []
  });

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [usersRes, appsRes, paymentsRes] = await Promise.all([
          adminApi.getUsers().catch(() => []),
          adminApi.getAllApplications().catch(() => []),
          adminApi.getPayments().catch(() => [])
        ]);

        const usersList = usersRes?.results || usersRes || [];
        const appsList = appsRes?.results || appsRes || [];
        const paymentsList = paymentsRes?.results || paymentsRes || [];

        const totalUsers = usersRes?.count || usersList.length;
        const totalApps = appsRes?.count || appsList.length;

        // Calculate Revenue
        const totalRevenue = paymentsList
          .filter((p: any) => p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + (Number(p.amount_etb) || 0), 0);

        // Calculate Application Status Distribution
        const statusCounts: Record<string, number> = {};
        appsList.forEach((app: any) => {
          const status = app.status || 'UNKNOWN';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const parsedStatusData = Object.entries(statusCounts).map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          value
        }));

        // Calculate Revenue by Method
        const methodCounts: Record<string, number> = {};
        paymentsList.filter((p: any) => p.status === 'COMPLETED').forEach((p: any) => {
          const method = p.payment_method || 'UNKNOWN';
          methodCounts[method] = (methodCounts[method] || 0) + (Number(p.amount_etb) || 0);
        });

        const parsedPaymentData = Object.entries(methodCounts).map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          amount: value
        }));

        setStats({
          totalUsers, 
          activeApplications: totalApps,
          revenueCollected: totalRevenue,
          slaBreaches: 0, // Fallback if no specific SLA endpoint
          statusData: parsedStatusData,
          revenueData: parsedPaymentData
        });

      } catch (err) {
        console.error('Failed to aggregate dashboard stats:', err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">System Administrator Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-highlight">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Apps</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{stats.activeApplications}</h3>
            </div>
            <div className="p-2 bg-highlight/20 text-highlight rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">
                {stats.revenueCollected ? (stats.revenueCollected / 1000).toFixed(1) : '0.0'}k
              </h3>
            </div>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-danger">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">SLA Breaches</p>
              <h3 className="text-2xl font-bold text-danger mt-2">{stats.slaBreaches || 0}</h3>
            </div>
            <div className="p-2 bg-danger/10 text-danger rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary mb-6">Revenue Overview (By Method)</h2>
          <div className="h-80 w-full" style={{ minHeight: '320px' }}>
            {stats.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <BarChart data={stats.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="amount" fill="#003049" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No revenue data available</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary mb-6">Applications by Status</h2>
          <div className="h-80 w-full" style={{ minHeight: '320px' }}>
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No status data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
