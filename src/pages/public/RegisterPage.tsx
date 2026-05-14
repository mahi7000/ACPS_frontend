import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/api/auth';
import { UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(9, 'Valid phone number required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: 'APPLICANT'
      });
      setSuccess(true);
      toast.success('Registration successful! Please verify your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="card max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Account Created!</h2>
          <p className="text-slate-600">
            We've sent a verification email to your address. Please verify your account to continue.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary w-full justify-center mt-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card max-w-md w-full p-8 space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Create Account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Register to apply for construction permits
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input 
                {...register('full_name')} 
                type="text" 
                className={`input-field ${errors.full_name ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="text-danger text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input 
                {...register('email')} 
                type="email" 
                className={`input-field ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input 
                {...register('phone')} 
                type="tel" 
                className={`input-field ${errors.phone ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="+251 911 234 567"
              />
              {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input 
                {...register('password')} 
                type="password" 
                className={`input-field ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input 
                {...register('confirm_password')} 
                type="password" 
                className={`input-field ${errors.confirm_password ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="••••••••"
              />
              {errors.confirm_password && <p className="text-danger text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn btn-primary flex justify-center py-3"
          >
            {loading ? 'Creating Account...' : (
              <>
                Create Account <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
