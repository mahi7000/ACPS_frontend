import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api/auth';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data);
      setIsSuccess(true);
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'An error occurred while requesting reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('auth.forgot_title')}</h2>
          <p className="text-slate-500 mt-2">
            {t('auth.forgot_subtitle')}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm border border-green-200">
              {t('auth.forgot_success')}
            </div>
            <Link to="/login" className="btn btn-outline w-full py-3">
              {t('auth.return_login')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">{t('auth.email_label')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`input-field pl-10 ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
                  placeholder={t('auth.email_placeholder')}
                />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3"
            >
              {isLoading ? t('auth.sending') : t('auth.send_reset_link')}
            </button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.back_login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
