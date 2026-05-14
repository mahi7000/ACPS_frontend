import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'primary' | 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  const btnClass = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-secondary',
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      <div className="relative w-auto max-w-md mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-xl outline-none focus:outline-none">
          <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
            <h3 className="text-xl font-semibold text-primary">{title}</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-slate-400 hover:text-slate-600 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onCancel}
            >
              <span className="flex items-center justify-center w-6 h-6 outline-none focus:outline-none">
                <X className="w-5 h-5" />
              </span>
            </button>
          </div>
          
          <div className="relative p-6 flex-auto">
            <p className="my-4 text-slate-600 text-base leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="flex items-center justify-end p-4 border-t border-solid border-slate-200 rounded-b space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              type="button"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className={clsx('btn text-sm', btnClass)}
              type="button"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
