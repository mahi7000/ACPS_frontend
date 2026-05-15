import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { inspectionsApi } from '@/services/api/inspections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploader } from '@/components/forms/FileUploader';
import {
  ArrowLeft, Play, Camera, MapPin, CheckCircle, XCircle,
  Save, Clock, User, Hash, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export const InspectionWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Outcome state
  const [outcome, setOutcome] = useState<'PASSED' | 'FAILED' | null>(null);
  const [failureSummary, setFailureSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [starting, setStarting] = useState(false);

  const fetchInspection = async () => {
    try {
      const data = await inspectionsApi.getById(id!);
      setInspection(data);
      setChecklist(data.checklist_items || []);
      setPhotos(data.photos || []);
    } catch {
      toast.error('Failed to load inspection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInspection(); }, [id]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await inspectionsApi.start(id!);
      toast.success('Inspection started — timestamp recorded');
      fetchInspection();
    } catch {
      toast.error('Failed to start inspection');
    } finally {
      setStarting(false);
    }
  };

  const handleChecklistChange = (itemId: string, result: string, notes: string) => {
    setChecklist(prev => prev.map(i => i.item_id === itemId ? { ...i, result, notes } : i));
  };

  const saveChecklist = async () => {
    setSavingChecklist(true);
    try {
      await inspectionsApi.updateChecklist(id!, { checklist_items: checklist });
      toast.success('Progress saved');
    } catch {
      toast.error('Failed to save checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!files.length) return;
    const newFiles = files.filter(f => !photoFiles.find(p => p.name === f.name));
    const updated = [...photoFiles, ...newFiles];
    setPhotoFiles(updated);

    const formData = new FormData();
    newFiles.forEach(f => formData.append('photos', f));
    formData.append('gps_lat', '9.011666');
    formData.append('gps_lng', '38.745426');
    try {
      await inspectionsApi.uploadPhotos(id!, formData);
      toast.success(`${newFiles.length} photo(s) uploaded`);
      fetchInspection();
    } catch {
      toast.error('Photo upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!outcome) { toast.error('Please select an outcome (Passed or Failed)'); return; }
    if (outcome === 'FAILED' && failureSummary.trim().length < 50) {
      toast.error('Failure summary must be at least 50 characters');
      return;
    }
    if (photos.length < 3 && photoFiles.length < 3) {
      toast.error('A minimum of 3 site photos are required');
      return;
    }

    setSubmitting(true);
    try {
      await saveChecklist();
      await inspectionsApi.submit(id!, {
        overall_result: outcome,
        ...(outcome === 'FAILED' && { failure_summary: failureSummary }),
      });
      toast.success(`Inspection submitted — ${outcome}`);
      navigate('/inspector/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!inspection) return <div>Inspection not found</div>;

  const inProgress = inspection.status === 'IN_PROGRESS';
  const isCompleted = inspection.status === 'COMPLETED' || inspection.status === 'FAILED';
  const totalItems = checklist.length;
  const passedItems = checklist.filter(i => i.result === 'PASS').length;
  const failedItems = checklist.filter(i => i.result === 'FAIL').length;
  const naItems = checklist.filter(i => i.result === 'NA').length;
  const completedItems = passedItems + failedItems + naItems;
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/inspector/dashboard" className="text-slate-400 hover:text-primary mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">
              {inspection.inspection_type?.replace(/_/g, ' ')}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              inProgress ? 'bg-blue-100 text-blue-700' :
              inspection.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-700' :
              inspection.overall_result === 'PASSED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {isCompleted ? inspection.overall_result || inspection.status : inspection.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Hash className="w-4 h-4" /> {inspection.application_arn || 'N/A'}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {inspection.subcity_id} / {inspection.woreda}</span>
            {inspection.scheduled_date && (
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(parseISO(inspection.scheduled_date), 'EEE, MMM dd yyyy · HH:mm')}</span>
            )}
            {inspection.supervisor_name && (
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {t('inspector.supervisor')} {inspection.supervisor_name} · {inspection.supervisor_phone}</span>
            )}
          </div>
        </div>
        {inspection.status === 'SCHEDULED' && (
          <button onClick={handleStart} disabled={starting} className="btn btn-primary gap-2 shrink-0">
            <Play className="w-4 h-4" /> {starting ? t('inspector.starting') : t('inspector.start_inspection')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checklist */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-primary">{t('inspector.inspection_checklist')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{completedItems} / {totalItems} {t('inspector.items_completed')}</p>
              </div>
              {inProgress && (
                <button onClick={saveChecklist} disabled={savingChecklist} className="btn btn-outline text-sm gap-2 py-1.5 px-3">
                  <Save className="w-4 h-4" /> {savingChecklist ? t('inspector.saving') : t('inspector.save_progress')}
                </button>
              )}
            </div>

            {/* Progress bar */}
            {totalItems > 0 && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{progress}% {t('inspector.complete')}</span>
                  <span className="flex gap-3">
                    <span className="text-green-600">✓ {passedItems} {t('inspector.pass')}</span>
                    <span className="text-red-500">✗ {failedItems} {t('inspector.fail')}</span>
                    <span className="text-slate-400">— {naItems} {t('inspector.na')}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${failedItems > 0 ? 'bg-orange-400' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {checklist.map((item: any, idx: number) => (
                <div
                  key={item.item_id || idx}
                  className={`rounded-xl border p-4 transition-colors ${
                    item.result === 'PASS' ? 'bg-green-50 border-green-200' :
                    item.result === 'FAIL' ? 'bg-red-50 border-red-200' :
                    item.result === 'NA' ? 'bg-slate-50 border-slate-200' :
                    'bg-white border-slate-200'
                  }`}
                >
                  <p className="font-medium text-slate-800 mb-3 text-sm">{item.item_text}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2">
                      {(['PASS', 'FAIL', 'NA'] as const).map(res => (
                        <button
                          key={res}
                          disabled={!inProgress}
                          onClick={() => handleChecklistChange(item.item_id, res, item.notes || '')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
                            item.result === res
                              ? res === 'PASS' ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                : res === 'FAIL' ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                : 'bg-slate-400 border-slate-400 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      disabled={!inProgress}
                      value={item.notes || ''}
                      onChange={e => handleChecklistChange(item.item_id, item.result || '', e.target.value)}
                      placeholder={t('inspector.add_notes')}
                      className="input-field flex-1 py-1.5 text-sm"
                    />
                  </div>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-8">{t('inspector.no_checklist')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Photos + Outcome */}
        <div className="space-y-5">
          {/* Photos */}
          <div className="card p-5">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" /> {t('inspector.site_photos')}
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                (photos.length + photoFiles.length) >= 3
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {photos.length + photoFiles.length} / 3 {t('inspector.min')}
              </span>
            </h2>

            {/* Preview grid */}
            {(photos.length > 0 || photoFiles.length > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Already uploaded photos from API */}
                {photos.map((p: any, idx: number) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                    {p.url ? (
                      <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <MapPin className="w-6 h-6 text-slate-400" />
                        <span className="text-[9px] text-slate-400 mt-1">{t('inspector.gps_tagged')}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1 py-0.5 text-[8px] text-white text-center truncate">
                      {p.gps_lat ? `${Number(p.gps_lat).toFixed(4)}, ${Number(p.gps_lng).toFixed(4)}` : t('inspector.gps_tagged')}
                    </div>
                  </div>
                ))}
                {/* Locally selected (not yet uploaded or just uploaded) */}
                {photoFiles.map((f, idx) => (
                  <div key={`local-${idx}`} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative border border-green-300">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-green-600/70 px-1 py-0.5 text-[8px] text-white text-center">{t('inspector.uploaded')}</div>
                  </div>
                ))}
              </div>
            )}

            {inProgress && (
              <FileUploader
                onUpload={handlePhotoUpload}
                acceptedTypes={['image/jpeg', 'image/png', 'image/heic']}
                maxSizeMB={15}
                multiple
                label={t('inspector.add_photos')}
              />
            )}

            {!inProgress && photos.length === 0 && (
              <p className="text-slate-400 text-xs italic text-center py-4">{t('inspector.no_photos')}</p>
            )}
          </div>

          {/* Outcome */}
          {inProgress && (
            <div className="card p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4">{t('inspector.inspection_outcome')}</h2>
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setOutcome('PASSED')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    outcome === 'PASSED'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${outcome === 'PASSED' ? 'text-green-600' : 'text-slate-300'}`} />
                  {t('inspector.inspection_passed')}
                </button>
                <button
                  onClick={() => setOutcome('FAILED')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    outcome === 'FAILED'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${outcome === 'FAILED' ? 'text-red-500' : 'text-slate-300'}`} />
                  {t('inspector.inspection_failed')}
                </button>
              </div>

              {outcome === 'FAILED' && (
                <div className="mb-4">
                  <label className="label flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    {t('inspector.failure_summary')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={failureSummary}
                    onChange={e => setFailureSummary(e.target.value)}
                    rows={4}
                    placeholder={t('inspector.describe_failures')}
                    className="input-field text-sm"
                  />
                  <p className={`text-xs mt-1 ${failureSummary.length < 50 ? 'text-orange-500' : 'text-green-600'}`}>
                    {failureSummary.length}/50 {t('inspector.characters')}
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !outcome}
                className={`w-full py-3 font-semibold rounded-xl text-white transition-all text-sm ${
                  !outcome ? 'bg-slate-300 cursor-not-allowed' :
                  outcome === 'PASSED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? t('inspector.saving') : `${t('inspector.submit')} ${outcome || t('inspector.select_outcome')}`}
              </button>
            </div>
          )}

          {/* Completed Result */}
          {isCompleted && (
            <div className={`card p-5 border-2 ${inspection.overall_result === 'PASSED' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {inspection.overall_result === 'PASSED'
                  ? <CheckCircle className="w-8 h-8 text-green-600" />
                  : <XCircle className="w-8 h-8 text-red-600" />}
                <div>
                  <p className="font-bold text-lg">{inspection.overall_result}</p>
                  {inspection.failure_summary && (
                    <p className="text-sm text-slate-600 mt-1">{inspection.failure_summary}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
