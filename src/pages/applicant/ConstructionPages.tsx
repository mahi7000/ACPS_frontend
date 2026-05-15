import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { inspectionsApi } from '@/services/api/inspections';
import { FileUploader } from '@/components/forms/FileUploader';
import toast from 'react-hot-toast';
import { HardHat, CheckSquare } from 'lucide-react';

const commenceSchema = z.object({
  start_date: z.string().min(1, 'Required'),
  contractor_name: z.string().min(1, 'Required'),
  contractor_license: z.string().min(1, 'Required'),
  supervisor_name: z.string().min(1, 'Required'),
  supervisor_phone: z.string().min(1, 'Required'),
});

export const CommencePage: React.FC = () => {
  const { t } = useTranslation();
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: {} } = useForm({
    resolver: zodResolver(commenceSchema)
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await inspectionsApi.commence(applicationId!, data);
      toast.success('Commencement declared successfully');
      navigate(`/applicant/applications/${applicationId}`);
    } catch (err) {
      toast.error('Failed to declare commencement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="card p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6 mx-auto">
          <HardHat className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">{t('construction.commence_title')}</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div><label className="label">{t('construction.start_date')}</label><input type="date" {...register('start_date')} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{t('construction.contractor_name')}</label><input type="text" {...register('contractor_name')} className="input-field" /></div>
            <div><label className="label">{t('construction.contractor_license')}</label><input type="text" {...register('contractor_license')} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{t('construction.supervisor_name')}</label><input type="text" {...register('supervisor_name')} className="input-field" /></div>
            <div><label className="label">{t('construction.supervisor_phone')}</label><input type="text" {...register('supervisor_phone')} className="input-field" /></div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {t('construction.submit_declaration')}
          </button>
        </form>
      </div>
    </div>
  );
};

export const DeclareCompletionPage: React.FC = () => {
  const { t } = useTranslation();
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [date, setDate] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length < 5) return toast.error('Minimum 5 photos required');
    if (!date) return toast.error('Completion date is required');

    setLoading(true);
    const formData = new FormData();
    formData.append('completion_date', date);
    photos.forEach(p => formData.append('photos', p));

    try {
      await inspectionsApi.declareCompletion(applicationId!, formData);
      toast.success('Completion declared successfully');
      navigate(`/applicant/applications/${applicationId}`);
    } catch (err) {
      toast.error('Failed to declare completion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="card p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6 mx-auto">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">{t('construction.declare_title')}</h1>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div><label className="label">{t('construction.completion_date')}</label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-field" /></div>
          <div>
            <label className="label">{t('construction.upload_photos')}</label>
            <p className="text-sm text-slate-500 mb-2">{t('construction.upload_photos_desc')}</p>
            <FileUploader 
              onUpload={setPhotos} 
              acceptedTypes={['image/jpeg', 'image/png']} 
              maxSizeMB={10} 
              multiple 
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {t('construction.request_inspection')}
          </button>
        </form>
      </div>
    </div>
  );
};
