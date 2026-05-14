import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api/auth';
import { Lock, ArrowRight } from 'lucide-react';

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!uid || !token) {
      toast.error('Invalid or missing reset token.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        uid,
        token,
        new_password: data.new_password,
      });
      toast.success('Password has been reset successfully.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'An error occurred while resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-danger mb-4">Invalid Link</h2>
          <p className="text-slate-600 mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn btn-primary w-full">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
          <p className="text-slate-500 mt-2">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                {...register('new_password')}
                className={`input-field pl-10 ${errors.new_password ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.new_password && <p className="text-danger text-xs mt-1">{errors.new_password.message}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                {...register('confirm_password')}
                className={`input-field pl-10 ${errors.confirm_password ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirm_password && <p className="text-danger text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 inline-flex items-center justify-center"
          >
            {isLoading ? 'Resetting...' : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
