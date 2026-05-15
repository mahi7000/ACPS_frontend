import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  Building2, LogOut, Menu, X, Bell, LayoutDashboard, 
  FileText, ClipboardList, Settings, Users, Banknote 
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';

export const AuthenticatedLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'APPLICANT':
        return [
          { name: 'Dashboard', path: '/applicant/dashboard', icon: LayoutDashboard },
          { name: 'My Applications', path: '/applicant/applications', icon: FileText },
          { name: 'Profile & Vault', path: '/applicant/profile', icon: Users },
        ];
      case 'REVIEW_OFFICER':
        return [
          { name: 'Dashboard', path: '/reviewer/dashboard', icon: LayoutDashboard },
        ];
      case 'INSPECTOR':
        return [
          { name: 'Dashboard', path: '/inspector/dashboard', icon: LayoutDashboard },
        ];
      case 'SENIOR_OFFICER':
        return [
          { name: 'Dashboard', path: '/senior/dashboard', icon: LayoutDashboard },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Applications', path: '/admin/applications', icon: FileText },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Payments', path: '/admin/payments', icon: Banknote },
          { name: 'Config', path: '/admin/config', icon: Settings },
          { name: 'Audit Log', path: '/admin/audit-log', icon: ClipboardList },
          { name: 'Reports', path: '/admin/reports', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-primary text-white z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-4 flex justify-between items-center bg-primary border-b border-white/10">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <Building2 className="w-8 h-8 text-highlight" />
            <span>ACPS</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive ? 'bg-highlight text-primary font-medium' : 'hover:bg-white/10'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-slate-300 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-primary rounded-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
