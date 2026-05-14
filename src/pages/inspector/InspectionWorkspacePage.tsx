import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { inspectionsApi } from '@/services/api/inspections';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploader } from '@/components/forms/FileUploader';
import { ArrowLeft, Play, Camera, MapPin, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const InspectionWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchInspection = async () => {
    try {
      const data = await inspectionsApi.getById(id!);
      setInspection(data);
      setChecklist(data.checklist_items || []);
      setPhotos(data.photos || []);
    } catch (err) {
      toast.error('Failed to load inspection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const handleStart = async () => {
    try {
      await inspectionsApi.start(id!);
      toast.success('Inspection started');
      fetchInspection();
    } catch (err) {
      toast.error('Failed to start inspection');
    }
  };

  const handleChecklistChange = (itemId: string, result: string, notes: string) => {
    setChecklist(prev => prev.map(i => i.item_id === itemId ? { ...i, result, notes } : i));
  };

  const saveChecklist = async () => {
    try {
      await inspectionsApi.updateChecklist(id!, { checklist_items: checklist });
      toast.success('Checklist saved');
    } catch (err) {
      toast.error('Failed to save checklist');
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    
    // Simulating GPS coordinates extraction from EXIF
    formData.append('gps_lat', '9.011666');
    formData.append('gps_lng', '38.745426');

    try {
      await inspectionsApi.uploadPhotos(id!, formData);
      toast.success('Photos uploaded');
      fetchInspection();
    } catch (err) {
      toast.error('Failed to upload photos');
    }
  };

  const submitInspection = async (overallResult: 'PASSED' | 'FAILED') => {
    try {
      await saveChecklist(); // Ensure checklist is saved
      const payload: any = { overall_result: overallResult };
      if (overallResult === 'FAILED') {
        const failureSummary = prompt('Please provide a failure summary:');
        if (!failureSummary) return toast.error('Failure summary is required to fail an inspection.');
        payload.failure_summary = failureSummary;
      }
      await inspectionsApi.submit(id!, payload);
      toast.success(`Inspection ${overallResult.toLowerCase()} successfully`);
      navigate('/inspector/dashboard');
    } catch (err) {
      toast.error('Failed to submit inspection');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!inspection) return <div>Inspection not found</div>;

  const inProgress = inspection.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/inspector/dashboard" className="text-slate-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{inspection.inspection_type.replace('_', ' ')}</h1>
          <p className="text-slate-500 text-sm">ARN: {inspection.application_arn}</p>
        </div>
        <div className="flex-1" />
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${inProgress ? 'bg-primary text-white' : inspection.status === 'SCHEDULED' ? 'bg-warning text-white' : 'bg-green-600 text-white'}`}>
          {inspection.status}
        </span>
        {inspection.status === 'SCHEDULED' && (
          <button onClick={handleStart} className="btn btn-primary">
            <Play className="w-4 h-4 mr-2" /> Start Inspection
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-lg font-bold text-primary">Inspection Checklist</h2>
              {inProgress && (
                <button onClick={saveChecklist} className="btn btn-outline text-xs py-1.5 px-3">Save Progress</button>
              )}
            </div>

            <div className="space-y-6">
              {checklist.map((item: any, idx: number) => (
                <div key={item.item_id || idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-800 mb-3">{item.item_text}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex space-x-2">
                      {['PASS', 'FAIL', 'NA'].map(res => (
                        <button
                          key={res}
                          disabled={!inProgress}
                          onClick={() => handleChecklistChange(item.item_id, res, item.notes || '')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                            item.result === res 
                              ? res === 'PASS' ? 'bg-green-100 border-green-500 text-green-700' : 
                                res === 'FAIL' ? 'bg-danger/10 border-danger text-danger' : 'bg-slate-200 border-slate-400 text-slate-700'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
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
                      placeholder="Add notes..."
                      className="input-field flex-1 py-1.5"
                    />
                  </div>
                </div>
              ))}
              {checklist.length === 0 && <p className="text-slate-500 italic">No checklist items provided.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary border-b pb-4 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" /> Site Photos
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {photos.map((_p: any, idx: number) => (
                  <div key={idx} className="relative group rounded-md overflow-hidden bg-slate-100 aspect-square flex items-center justify-center border border-slate-200">
                    {/* In real app, render img tag */}
                    <MapPin className="w-8 h-8 text-slate-400" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white text-center">
                      GPS Tagged
                    </div>
                  </div>
                ))}
              </div>
              
              {inProgress && (
                <FileUploader 
                  onUpload={handlePhotoUpload} 
                  acceptedTypes={['image/jpeg', 'image/png']} 
                  maxSizeMB={10} 
                  multiple 
                  label=""
                />
              )}
            </div>
          </div>

          {inProgress && (
            <div className="card p-6 bg-slate-50 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Complete Inspection</h2>
              <div className="space-y-3">
                <button onClick={() => submitInspection('PASSED')} className="btn btn-primary bg-green-600 hover:bg-green-700 w-full py-3 justify-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2" /> Pass Inspection
                </button>
                <button onClick={() => submitInspection('FAILED')} className="btn btn-outline text-danger border-danger hover:bg-danger/10 w-full py-3 justify-center text-lg">
                  <XCircle className="w-5 h-5 mr-2" /> Fail Inspection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
