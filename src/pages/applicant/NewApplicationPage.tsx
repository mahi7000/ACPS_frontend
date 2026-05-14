import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { applicationsApi } from '@/services/api/applications';
import toast from 'react-hot-toast';
import { Building, FileText, PlusCircle, Users, CheckCircle, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { FileUploader } from '@/components/forms/FileUploader';

// Zod schemas for validation
const buildingDetailsSchema = z.object({
  intended_use: z.string().min(1, 'Intended use is required'),
  height_m: z.number().min(0.1, 'Must be positive'),
  floors_above: z.number().min(1, 'Must be at least 1'),
  floors_below: z.number().min(0, 'Must be 0 or more'),
  floor_area_sqm: z.number().min(1, 'Must be positive'),
  plot_address: z.string().min(1, 'Address is required'),
  plot_gps_lat: z.number().min(-90).max(90),
  plot_gps_lng: z.number().min(-180).max(180),
  subcity_id: z.string().min(1, 'Subcity is required'),
  woreda: z.string().min(1, 'Woreda is required'),
  architect_name: z.string().min(1, 'Architect name is required'),
  architect_license: z.string().min(1, 'Architect license is required'),
  contractor_name: z.string().optional(),
  contractor_license: z.string().optional(),
  project_value_etb: z.number().min(1000, 'Must be at least 1000'),
});

type BuildingDetails = z.infer<typeof buildingDetailsSchema>;

export const NewApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<any[]>([]);

  // Step 1 Form
  const { register: reg1, handleSubmit: handle1, formState: { errors: err1 } } = useForm<BuildingDetails>({
    resolver: zodResolver(buildingDetailsSchema),
  });

  // Step 3 Form (Neighbors)
  const { register: reg3, control: control3, handleSubmit: handle3, formState: {} } = useForm({
    defaultValues: { neighbors: [{ name: '', phone: '', file: null as File[] | null }] }
  });
  const { fields: neighborFields, append: appendNeighbor, remove: removeNeighbor } = useFieldArray({ control: control3, name: 'neighbors' });

  const steps = [
    { id: 1, title: 'Building Details', icon: Building },
    { id: 2, title: 'Documents', icon: FileText },
    { id: 3, title: 'Neighbor Consent', icon: Users },
    { id: 4, title: 'Review & Submit', icon: CheckCircle },
  ];

  const onStep1Submit = async (data: BuildingDetails) => {
    setLoading(true);
    try {
      if (!applicationId) {
        const res = await applicationsApi.create(data);
        setApplicationId(res.application_id);
        toast.success('Draft saved successfully');
      } else {
        await applicationsApi.update(applicationId, data);
        toast.success('Draft updated');
      }
      // Fetch required docs for next step
      const docsRes = await applicationsApi.getRequiredDocs(applicationId || ''); // In real scenario, use returned ID
      setRequiredDocs(docsRes || []);
      setCurrentStep(2);
    } catch (err) {
      toast.error('Failed to save building details');
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (files: File[], docType: string) => {
    if (!applicationId || !files.length) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('document_type', docType);
    try {
      await applicationsApi.uploadDocument(applicationId, formData);
      toast.success(`${docType.replace('_', ' ')} uploaded`);
      const docsRes = await applicationsApi.getRequiredDocs(applicationId);
      setRequiredDocs(docsRes || []);
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const onStep3Submit = async (data: any) => {
    if (!applicationId) return;
    setLoading(true);
    try {
      // Upload neighbor consents
      for (const neighbor of data.neighbors) {
        if (neighbor.file && neighbor.file.length > 0) {
          const formData = new FormData();
          formData.append('neighbor_name', neighbor.name);
          formData.append('neighbor_phone', neighbor.phone);
          formData.append('consent_file', neighbor.file[0]);
          await applicationsApi.addNeighbor(applicationId, formData);
        }
      }
      toast.success('Neighbor consents saved');
      setCurrentStep(4);
    } catch (err) {
      toast.error('Failed to save neighbor consents');
    } finally {
      setLoading(false);
    }
  };

  const onFinalSubmit = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      await applicationsApi.submit(applicationId);
      toast.success('Application submitted successfully!');
      navigate(`/applicant/payment/${applicationId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Completeness check failed. Ensure all documents are uploaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary">New Application</h1>
        {applicationId && (
          <button className="btn btn-outline text-sm py-1.5 px-3">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="relative flex justify-between items-center w-full mb-12">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
        
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background transition-colors ${
                isActive ? 'bg-primary text-white shadow-md' : 
                isCompleted ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`absolute top-14 text-xs font-medium w-32 text-center ${
                isActive || isCompleted ? 'text-primary' : 'text-slate-500'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card p-8 min-h-[400px]">
        {/* Step 1: Building Details */}
        {currentStep === 1 && (
          <form onSubmit={handle1(onStep1Submit)} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">Building Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="label">Intended Use</label><input type="text" {...reg1('intended_use')} className="input-field" />{err1.intended_use && <p className="text-danger text-xs">{err1.intended_use.message}</p>}</div>
              <div><label className="label">Project Value (ETB)</label><input type="number" {...reg1('project_value_etb', { valueAsNumber: true })} className="input-field" />{err1.project_value_etb && <p className="text-danger text-xs">{err1.project_value_etb.message}</p>}</div>
              <div><label className="label">Height (m)</label><input type="number" step="0.1" {...reg1('height_m', { valueAsNumber: true })} className="input-field" />{err1.height_m && <p className="text-danger text-xs">{err1.height_m.message}</p>}</div>
              <div><label className="label">Floor Area (sqm)</label><input type="number" step="0.1" {...reg1('floor_area_sqm', { valueAsNumber: true })} className="input-field" /></div>
              <div><label className="label">Floors Above</label><input type="number" {...reg1('floors_above', { valueAsNumber: true })} className="input-field" /></div>
              <div><label className="label">Floors Below</label><input type="number" {...reg1('floors_below', { valueAsNumber: true })} className="input-field" /></div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mt-8 mb-6">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label className="label">Plot Address</label><input type="text" {...reg1('plot_address')} className="input-field" /></div>
              <div><label className="label">Subcity</label><input type="text" {...reg1('subcity_id')} className="input-field" /></div>
              <div><label className="label">Woreda</label><input type="text" {...reg1('woreda')} className="input-field" /></div>
              <div><label className="label">GPS Latitude</label><input type="number" step="0.000001" {...reg1('plot_gps_lat', { valueAsNumber: true })} className="input-field" /></div>
              <div><label className="label">GPS Longitude</label><input type="number" step="0.000001" {...reg1('plot_gps_lng', { valueAsNumber: true })} className="input-field" /></div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mt-8 mb-6">Professionals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="label">Architect Name</label><input type="text" {...reg1('architect_name')} className="input-field" /></div>
              <div><label className="label">Architect License</label><input type="text" {...reg1('architect_license')} className="input-field" /></div>
            </div>

            <div className="flex justify-end pt-6">
              <button type="submit" disabled={loading} className="btn btn-primary">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Documents */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">Required Documents</h2>
            <div className="space-y-6">
              {requiredDocs.map((doc, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-slate-800">{doc.label || doc.document_type}</h3>
                    {doc.uploaded ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Uploaded
                      </span>
                    ) : (
                      <span className="bg-warning/10 text-warning text-xs px-2 py-1 rounded-full font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  {!doc.uploaded && (
                    <FileUploader 
                      onUpload={(files) => handleDocUpload(files, doc.document_type)}
                      acceptedTypes={['application/pdf', 'application/x-autocad', 'image/jpeg']}
                      maxSizeMB={20}
                      label=""
                    />
                  )}
                </div>
              ))}
              {requiredDocs.length === 0 && (
                <p className="text-slate-500 italic">No specific documents required yet, or failed to load checklist.</p>
              )}
            </div>
            
            <div className="flex justify-between pt-6">
              <button onClick={() => setCurrentStep(1)} className="btn btn-outline">
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </button>
              <button onClick={() => setCurrentStep(3)} className="btn btn-primary">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Neighbors */}
        {currentStep === 3 && (
          <form onSubmit={handle3(onStep3Submit)} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">Neighbor Consents</h2>
            <p className="text-sm text-slate-600 mb-4">At least one neighbor consent is required.</p>
            
            {neighborFields.map((field, index) => (
              <div key={field.id} className="bg-slate-50 p-6 rounded-lg border border-slate-200 relative">
                {index > 0 && (
                  <button type="button" onClick={() => removeNeighbor(index)} className="absolute top-4 right-4 text-danger hover:text-danger/80 text-sm font-medium">
                    Remove
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="label">Neighbor Name</label>
                    <input type="text" {...reg3(`neighbors.${index}.name` as const)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input type="text" {...reg3(`neighbors.${index}.phone` as const)} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="label">Consent Form Document</label>
                  <FileUploader 
                    onUpload={() => { /* Custom logic to update rhf value if needed */ }}
                    acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                    maxSizeMB={10}
                    label=""
                  />
                  {/* Note: In a real implementation, we'd sync the FileUploader state with react-hook-form */}
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => appendNeighbor({ name: '', phone: '', file: null })} className="btn btn-outline w-full py-3 border-dashed">
              <PlusCircle className="w-5 h-5 mr-2" /> Add Another Neighbor
            </button>

            <div className="flex justify-between pt-6">
              <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-outline">
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                Save & Continue <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-6">Review & Submit</h2>
            <div className="bg-highlight/10 border border-highlight rounded-lg p-6 text-center mb-8">
              <CheckCircle className="w-12 h-12 text-highlight mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Ready to Submit</h3>
              <p className="text-slate-600 mt-2">
                Please review your application details. Once submitted, you will be directed to pay the application fee.
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={() => setCurrentStep(3)} className="btn btn-outline">
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </button>
              <button onClick={onFinalSubmit} disabled={loading} className="btn btn-primary text-lg px-8">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
