import React from 'react';
import type { ApplicationStatus } from '@/types';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-highlight text-primary';
      case 'PAYMENT_PENDING':
        return 'bg-warning text-white';
      case 'AWAITING_ASSIGNMENT':
      case 'UNDER_REVIEW':
      case 'AWAITING_SENIOR_APPROVAL':
        return 'bg-primary text-white';
      case 'REVISION_REQUIRED':
      case 'REJECTED':
      case 'PAYMENT_EXPIRED':
        return 'bg-danger text-white';
      case 'CONSENT_ISSUED':
      case 'PERMIT_ISSUED':
      case 'COMPLETION_DECLARED':
      case 'COMPLETED':
        return 'bg-green-600 text-white';
      case 'UNDER_CONSTRUCTION':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-full',
        getStatusConfig(status),
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {formatStatusText(status)}
    </span>
  );
};
