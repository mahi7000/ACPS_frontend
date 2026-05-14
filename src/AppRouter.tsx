import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { RoleGuard } from '@/components/common/RoleGuard';

import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { VerifyPermitPage } from '@/pages/public/VerifyPermitPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage';

import { ApplicantDashboard } from '@/pages/applicant/DashboardPage';
import { ProfilePage } from '@/pages/applicant/ProfilePage';
import { ApplicationsPage } from '@/pages/applicant/ApplicationsPage';
import { NewApplicationPage } from '@/pages/applicant/NewApplicationPage';

import { ApplicationDetailPage } from '@/pages/applicant/ApplicationDetailPage';
import { PaymentPage } from '@/pages/applicant/PaymentPage';
import { CommencePage, DeclareCompletionPage } from '@/pages/applicant/ConstructionPages';

import { InspectorDashboard } from '@/pages/inspector/DashboardPage';
import { InspectionWorkspacePage } from '@/pages/inspector/InspectionWorkspacePage';

import { SeniorDashboard } from '@/pages/senior/DashboardPage';
import { ApprovalWorkspacePage } from '@/pages/senior/ApprovalWorkspacePage';
import { CompletionReviewPage } from '@/pages/senior/CompletionReviewPage';

import { AdminDashboard } from '@/pages/admin/DashboardPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { ConfigPage, ReportsPage } from '@/pages/admin/AdminPages';
import { PaymentManagementPage } from '@/pages/admin/PaymentManagementPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { ApplicationAssignmentPage } from '@/pages/admin/ApplicationAssignmentPage';
import { ReviewerDashboard } from '@/pages/reviewer/DashboardPage';
import { ReviewWorkspacePage } from '@/pages/reviewer/ReviewWorkspacePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify', element: <VerifyPermitPage /> },
      { path: 'verify/:permitNumber', element: <VerifyPermitPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/applicant',
    element: (
      <RoleGuard allowedRoles={['APPLICANT']}>
        <AuthenticatedLayout />
      </RoleGuard>
    ),
    children: [
      { path: 'dashboard', element: <ApplicantDashboard /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'applications/new', element: <NewApplicationPage /> },
      { path: 'applications/:id', element: <ApplicationDetailPage /> },
      { path: 'payment/:applicationId', element: <PaymentPage /> },
      { path: 'commence/:applicationId', element: <CommencePage /> },
      { path: 'declare-completion/:applicationId', element: <DeclareCompletionPage /> },
      { index: true, element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '/reviewer',
    element: (
      <RoleGuard allowedRoles={['REVIEW_OFFICER']}>
        <AuthenticatedLayout />
      </RoleGuard>
    ),
    children: [
      { path: 'dashboard', element: <ReviewerDashboard /> },
      { path: 'applications/:id', element: <ReviewWorkspacePage /> },
      { index: true, element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '/inspector',
    element: (
      <RoleGuard allowedRoles={['INSPECTOR']}>
        <AuthenticatedLayout />
      </RoleGuard>
    ),
    children: [
      { path: 'dashboard', element: <InspectorDashboard /> },
      { path: 'inspections/:id', element: <InspectionWorkspacePage /> },
      { index: true, element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '/senior',
    element: (
      <RoleGuard allowedRoles={['SENIOR_OFFICER']}>
        <AuthenticatedLayout />
      </RoleGuard>
    ),
    children: [
      { path: 'dashboard', element: <SeniorDashboard /> },
      { path: 'applications/:id', element: <ApprovalWorkspacePage /> },
      { path: 'completion-review/:applicationId', element: <CompletionReviewPage /> },
      { index: true, element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <AuthenticatedLayout />
      </RoleGuard>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'payments', element: <PaymentManagementPage /> },
      { path: 'assignments', element: <ApplicationAssignmentPage /> },
      { path: 'config', element: <ConfigPage /> },
      { path: 'audit-log', element: <AuditLogPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { index: true, element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <div className="min-h-screen flex items-center justify-center">404 - Not Found</div>,
  }
]);
