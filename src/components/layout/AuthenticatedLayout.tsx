import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2, LogOut, Menu, X, Bell, LayoutDashboard,
  FileText, ClipboardList, Settings, Users, Banknote, UserCheck,
} from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';

export const AuthenticatedLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          { name: 'Assignments', path: '/admin/assignments', icon: UserCheck },
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-primary">
            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <span>ACPS</span>
          </Link>
          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${isActive
                        ? 'bg-highlight/10 text-primary'
                        : 'text-slate-500 hover:text-primary hover:bg-slate-50'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-highlight' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-danger rounded-xl hover:bg-danger/5 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-primary rounded-xl hover:bg-slate-50 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2" ref={notifRef}>
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className={`relative p-2 rounded-xl transition-colors ${showNotif ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-highlight rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        No notifications yet
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif: any) => (
                          <div 
                            key={notif.notification_id || Math.random()} 
                            className={`p-4 transition-colors hover:bg-slate-50 cursor-pointer ${!notif.is_read ? 'bg-primary/5' : ''}`}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.notification_id);
                              setShowNotif(false);
                            }}
                          >
                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                              {notif.message}
                            </p>
                            <span className="text-xs text-slate-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};