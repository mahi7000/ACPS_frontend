import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploader } from '@/components/forms/FileUploader';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import { format } from 'date-fns';
import {
  Building, FileText, Users, Clock, MessageSquare,
  Download, ArrowLeft, AlertCircle, Edit3, Save, X,
  CheckCircle, PlusCircle, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Draft editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add neighbour form state
  const [showAddNeighbor, setShowAddNeighbor] = useState(false);
  const [neighborForm, setNeighborForm] = useState({ name: '', phone: '' });
  const [neighborFile, setNeighborFile] = useState<File | null>(null);
  const [savingNeighbor, setSavingNeighbor] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchDetail = async () => {
    try {
      const data = await applicationsApi.getById(id!);
      setApp(data);
    } catch {
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequiredDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await applicationsApi.getRequiredDocs(id!);
      setRequiredDocs(docs || []);
    } catch {
      setRequiredDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Fetch required docs when switching to docs tab for a draft
  useEffect(() => {
    if (activeTab === 'docs' && app?.status === 'DRAFT') {
      fetchRequiredDocs();
    }
  }, [activeTab, app?.status]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!app) return <div>Application not found</div>;

  const isDraft = app.status === 'DRAFT';

  /* ── Inline edit: building details ── */
  const handleStartEdit = () => {
    reset({
      intended_use: app.intended_use,
      height_m: app.height_m,
      floors_above: app.floors_above,
      floors_below: app.floors_below,
      floor_area_sqm: app.floor_area_sqm,
      plot_address: app.plot_address,
      plot_gps_lat: app.plot_gps_lat,
      plot_gps_lng: app.plot_gps_lng,
      subcity_id: app.subcity_id,
      woreda: app.woreda,
      architect_name: app.architect_name,
      architect_license: app.architect_license,
      contractor_name: app.contractor_name,
      contractor_license: app.contractor_license,
      project_value_etb: app.project_value_etb,
    });
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async (data: any) => {
    setSavingDetails(true);
    try {
      const updated = await applicationsApi.update(id!, data);
      setApp((prev: any) => ({ ...prev, ...updated }));
      setIsEditingDetails(false);
      toast.success('Details updated successfully');
    } catch {
      toast.error('Failed to update details');
    } finally {
      setSavingDetails(false);
    }
  };

  /* ── Document upload (draft) ── */
  const handleDocUpload = async (files: File[], docType: string) => {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', files[0]);
    const tid = toast.loading(`Uploading ${docType}...`);
    try {
      await applicationsApi.uploadDocument(id!, formData);
      toast.success('Document uploaded', { id: tid });
      fetchRequiredDocs();
      fetchDetail();
    } catch (err: any) {
      const detail = JSON.stringify(err.response?.data);
      toast.error(`Upload failed: ${detail}`, { id: tid, duration: 6000 });
    }
  };

  /* ── Revision upload ── */
  const handleRevisionUpload = async (files: File[], docType: string) => {
    if (!files.length) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('document_type', docType);
    try {
      await applicationsApi.uploadDocument(id!, formData);
      toast.success('Revision uploaded');
      fetchDetail();
    } catch {
      toast.error('Upload failed');
    }
  };

  /* ── Add neighbour ── */
  const handleAddNeighbor = async () => {
    if (!neighborForm.name || !neighborForm.phone || !neighborFile) {
      toast.error('Name, phone and consent document are all required');
      return;
    }
    setSavingNeighbor(true);
    const fd = new FormData();
    fd.append('neighbor_name', neighborForm.name);
    fd.append('neighbor_phone', neighborForm.phone);
    fd.append('consent_file', neighborFile);
    try {
      await applicationsApi.addNeighbor(id!, fd);
      toast.success('Neighbour consent added');
      setShowAddNeighbor(false);
      setNeighborForm({ name: '', phone: '' });
      setNeighborFile(null);
      fetchDetail();
    } catch {
      toast.error('Failed to add neighbour');
    } finally {
      setSavingNeighbor(false);
    }
  };

  /* ── Remove neighbour ── */
  const handleRemoveNeighbor = async (neighborId: string) => {
    try {
      await applicationsApi.deleteNeighbor(id!, neighborId);
      toast.success('Neighbour removed');
      fetchDetail();
    } catch {
      toast.error('Failed to remove neighbour');
    }
  };

  /* ── Submit draft ── */
  const handleSubmitDraft = async () => {
    setSubmitting(true);
    try {
      await applicationsApi.submit(id!);
      toast.success('Application submitted successfully! It is now awaiting assignment.', { duration: 6000 });
      navigate('/applicant/dashboard');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.missing_documents) {
        const missing = errorData.missing_documents
          .map((d: any) => `• ${d.label || d.document_type.replace(/_/g, ' ')}`)
          .join('\n');
        toast.error(`Submission blocked. These documents must be accepted first:\n\n${missing}`, { duration: 8000 });
      } else {
        toast.error(errorData?.detail || 'Submission failed. Ensure all required documents are uploaded and valid.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Table columns ── */
  const docColumns: ColumnDef<any>[] = [
    { header: 'Type', accessorKey: 'document_type', cell: (i) => i.document_type.replace(/_/g, ' ') },
    { header: 'Name', accessorKey: 'file_name' },
    { header: 'Version', accessorKey: 'version_number', cell: (i) => `v${i.version_number}` },
    {
      header: 'Status', cell: (i) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          i.validation_status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
          i.validation_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {i.validation_status}
        </span>
      )
    },
    {
      header: 'Actions', cell: (i: any) => (
        <a href={i.file_url || i.file_path || '#'} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80"><Download className="w-4 h-4" /></a>
      )
    },
  ];

  const neighborColumns: ColumnDef<any>[] = [
    { header: 'Name', accessorKey: 'neighbor_name' },
    { header: 'Phone', accessorKey: 'neighbor_phone' },
    { header: 'Status', cell: (i: any) => <span className="bg-slate-100 px-2 py-1 rounded text-xs">{i.status}</span> },
    { header: 'Consent', cell: (i: any) => i.consent_document_url || i.file_url ? <a href={i.consent_document_url || i.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline"><Download className="w-4 h-4 inline mr-1" />View</a> : <span className="text-slate-400 text-xs">No file</span> },
    ...(isDraft ? [{
      header: '',
      cell: (i: any) => (
        <button
          onClick={() => handleRemoveNeighbor(i.neighbor_id || i.id)}
          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }] : []),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/applicant/applications" className="text-slate-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Application {app.arn || 'Draft'}</h1>
          <p className="text-slate-500 text-sm">Created on {format(new Date(app.created_at), 'PPP')}</p>
        </div>
        <div className="flex-1" />
        <StatusBadge status={app.status} size="md" />
        {(app.status === 'PAYMENT_PENDING' || app.status === 'PAYMENT_EXPIRED') && (
          <Link to={`/applicant/payment/${app.application_id}`} className="btn btn-primary">Pay Fees</Link>
        )}
        {isDraft && (
          <button
            onClick={handleSubmitDraft}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      {/* Draft banner */}
      {isDraft && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Edit3 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">This application is a Draft</p>
            <p className="text-sm text-blue-700 mt-0.5">
              You can edit your building details, upload missing documents, and add neighbour consents before submitting.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'details', label: 'Data', icon: Building },
          { key: 'docs', label: 'Documents', icon: FileText },
          { key: 'neighbors', label: 'Neighbors', icon: Users },
          { key: 'timeline', label: 'Timeline', icon: Clock },
          ...(app.status === 'REVISION_REQUIRED' ? [{ key: 'revision', label: 'Revisions', icon: MessageSquare }] : []),
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === key
                ? key === 'revision' ? 'bg-red-500 text-white shadow-sm' : 'bg-white text-primary shadow-sm'
                : key === 'revision' ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:text-primary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </div>
          </button>
        ))}
      </div>

      <div className="card p-6">

        {/* ── TAB: Details ── */}
        {activeTab === 'details' && (
          <div>
            {isDraft && !isEditingDetails && (
              <div className="flex justify-end mb-4">
                <button onClick={handleStartEdit} className="btn btn-outline text-sm gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Details
                </button>
              </div>
            )}

            {isEditingDetails ? (
              <form onSubmit={handleSubmit(handleSaveDetails)} className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Edit Building Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Intended Use</label>
                    <input type="text" {...register('intended_use', { required: true })} className="input-field" />
                    {errors.intended_use && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className="label">Project Value (ETB)</label>
                    <input type="number" {...register('project_value_etb', { required: true, valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Height (m)</label>
                    <input type="number" step="0.1" {...register('height_m', { required: true, valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Floor Area (sqm)</label>
                    <input type="number" step="0.1" {...register('floor_area_sqm', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Floors Above Ground</label>
                    <input type="number" {...register('floors_above', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Floors Below Ground</label>
                    <input type="number" {...register('floors_below', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="label">Plot Address</label>
                    <input type="text" {...register('plot_address')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Subcity</label>
                    <input type="text" {...register('subcity_id')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Woreda</label>
                    <input type="text" {...register('woreda')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">GPS Latitude</label>
                    <input type="number" step="0.000001" {...register('plot_gps_lat', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">GPS Longitude</label>
                    <input type="number" step="0.000001" {...register('plot_gps_lng', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Architect Name</label>
                    <input type="text" {...register('architect_name')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Architect License</label>
                    <input type="text" {...register('architect_license')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Contractor Name</label>
                    <input type="text" {...register('contractor_name')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Contractor License</label>
                    <input type="text" {...register('contractor_license')} className="input-field" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={savingDetails} className="btn btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    {savingDetails ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditingDetails(false)} className="btn btn-outline gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  ['Intended Use', app.intended_use],
                  ['Category', app.building_category],
                  ['Project Value', `${(app.project_value_etb || 0).toLocaleString()} ETB`],
                  ['Address', app.plot_address],
                  ['Subcity / Woreda', `${app.subcity_id} / ${app.woreda}`],
                  ['Height / Area', `${app.height_m}m / ${app.floor_area_sqm} sqm`],
                  ['Floors (Above / Below)', `${app.floors_above} / ${app.floors_below}`],
                  ['Architect', `${app.architect_name} (${app.architect_license})`],
                  ['Contractor', app.contractor_name || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Documents ── */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            {/* Uploaded documents table */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Uploaded Documents</h3>
              <DataTable data={app.documents || []} columns={docColumns} />
            </div>

            {/* Required documents uploader (draft only) */}
            {isDraft && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 pt-4 border-t border-slate-100">
                  Required Documents Checklist
                </h3>
                {loadingDocs ? (
                  <LoadingSpinner />
                ) : requiredDocs.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">All required documents are uploaded.</p>
                ) : (
                  <div className="space-y-4">
                    {requiredDocs.map((doc, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-800">{doc.label || doc.document_type.replace(/_/g, ' ')}</h4>
                          {doc.uploaded ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" /> Uploaded
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        {!doc.uploaded && (
                          <FileUploader
                            onUpload={(files) => handleDocUpload(files, doc.document_type)}
                            acceptedTypes={['application/pdf']}
                            maxSizeMB={20}
                            label=""
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Neighbors ── */}
        {activeTab === 'neighbors' && (
          <div className="space-y-6">
            <DataTable data={app.neighbors || []} columns={neighborColumns} />

            {/* Add neighbour (draft only) */}
            {isDraft && (
              <div className="pt-4 border-t border-slate-100">
                {!showAddNeighbor ? (
                  <button
                    onClick={() => setShowAddNeighbor(true)}
                    className="btn btn-outline w-full py-3 border-dashed gap-2"
                  >
                    <PlusCircle className="w-5 h-5" /> Add Neighbour Consent
                  </button>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
                    <h3 className="font-semibold text-slate-800">New Neighbour Consent</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Neighbour Name</label>
                        <input
                          type="text"
                          value={neighborForm.name}
                          onChange={(e) => setNeighborForm(p => ({ ...p, name: e.target.value }))}
                          className="input-field"
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input
                          type="text"
                          value={neighborForm.phone}
                          onChange={(e) => setNeighborForm(p => ({ ...p, phone: e.target.value }))}
                          className="input-field"
                          placeholder="+251..."
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Consent Document (PDF)</label>
                      <FileUploader
                        onUpload={(files) => setNeighborFile(files[0] ?? null)}
                        acceptedTypes={['application/pdf']}
                        maxSizeMB={10}
                        label=""
                      />
                      {neighborFile && (
                        <p className="text-xs text-green-600 mt-1">Selected: {neighborFile.name}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddNeighbor}
                        disabled={savingNeighbor}
                        className="btn btn-primary gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {savingNeighbor ? 'Saving...' : 'Save Consent'}
                      </button>
                      <button
                        onClick={() => { setShowAddNeighbor(false); setNeighborForm({ name: '', phone: '' }); setNeighborFile(null); }}
                        className="btn btn-outline gap-2"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Timeline ── */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 pl-4 border-l-2 border-slate-200 ml-4 py-2">
            {(app.timeline || app.history || []).map((event: any, idx: number) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                <p className="text-sm text-slate-500 mb-1">
                  {format(new Date(event.created_at), 'PPp')} by {event.actor_name}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">
                    Status changed to <span className="text-primary">{event.new_status}</span>
                  </p>
                  {event.note && <p className="text-sm text-slate-600 mt-2">{event.note}</p>}
                </div>
              </div>
            ))}
            {!(app.timeline || app.history)?.length && (
              <p className="text-slate-500 text-sm">No timeline events yet.</p>
            )}
          </div>
        )}

        {/* ── TAB: Revisions ── */}
        {activeTab === 'revision' && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-red-700 font-bold">Revisions Required</h3>
                <p className="text-red-600 text-sm mt-1">Please review the comments below and upload revised documents.</p>
              </div>
            </div>
            {(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').map((comment: any) => (
              <div key={comment.comment_id} className="border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium mr-2">{comment.category}</span>
                    <span className="text-sm text-slate-500">From {comment.author_name}</span>
                  </div>
                </div>
                <p className="text-slate-800 mb-6">{comment.content}</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Upload Revision</p>
                  <FileUploader
                    onUpload={(files) => handleRevisionUpload(files, 'ARCHITECTURAL')}
                    acceptedTypes={['application/pdf']}
                    maxSizeMB={20}
                  />
                </div>
              </div>
            ))}
            {!(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').length && (
              <p className="text-slate-500 text-sm">No open revision requests.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
