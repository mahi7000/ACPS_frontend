import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RoleGuardProps {
  allowedRoles: Array<'APPLICANT' | 'REVIEW_OFFICER' | 'INSPECTOR' | 'SENIOR_OFFICER' | 'ADMIN'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
