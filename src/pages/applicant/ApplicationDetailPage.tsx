import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  CheckCircle, PlusCircle, Trash2, Award, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ApplicationDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [permitData, setPermitData] = useState<any>(null);
  const [loadingPermit, setLoadingPermit] = useState(false);

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
      console.log('Application data:', data);
      console.log('Permit number:', data.permit_number);
      setApp(data);
      
      // If application has a permit number, fetch permit details
      if (data.permit_number) {
        fetchPermitDetails(data.permit_number);
      }
    } catch {
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermitDetails = async (permitNumber: string) => {
    setLoadingPermit(true);
    try {
      const permitInfo = await applicationsApi.getPermit(permitNumber);
      setPermitData(permitInfo);
    } catch (err) {
      console.error('Failed to fetch permit:', err);
      // Don't show error toast - permit might not be accessible yet
    } finally {
      setLoadingPermit(false);
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
  const hasPermit = app.status === 'PERMIT_ISSUED' || app.status === 'CONSENT_ISSUED' || app.status === 'COMPLETED';
  const permitNumber = app.permit_number || permitData?.permit_number;

  const handlePayNow = () => {
    if (app.invoice_id) {
      navigate(`/applicant/payment/${app.invoice_id}`);
      return;
    }

    const invoiceMap = JSON.parse(localStorage.getItem('app_invoices') || '{}');
    const storedInvoiceId = invoiceMap[app.application_id];

    if (storedInvoiceId) {
      navigate(`/applicant/payment/${storedInvoiceId}`);
      return;
    }

    toast.error('Invoice information not available. Please contact support.');
  };

  const handleDownloadPermit = () => {
    if (permitNumber) {
      // Open permit verification page in new tab
      window.open(`/api/v1/permits/${permitNumber}/`, '_blank');
    }
  };

  const handleVerifyPermit = () => {
    if (permitNumber) {
      // Open public verification page
      window.open(`/api/v1/verify/${permitNumber}/`, '_blank');
    }
  };

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
      const result = await applicationsApi.submit(id!);
      console.log('Submit result:', result);
      toast.success('Application submitted successfully!', { duration: 4000 });

      if (result.invoice_id && id) {
        const invoiceMap = JSON.parse(localStorage.getItem('app_invoices') || '{}');
        invoiceMap[id] = result.invoice_id;
        localStorage.setItem('app_invoices', JSON.stringify(invoiceMap));
      }

      setApp((prev: any) => ({
        ...prev,
        ...result,
        invoice_id: result.invoice_id
      }));

      if (result.invoice_id) {
        setTimeout(() => {
          navigate(`/applicant/payment/${result.invoice_id}`);
        }, 1500);
      } else {
        navigate('/applicant/dashboard');
      }
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
    { header: t('app_detail.doc_type'), accessorKey: 'document_type', cell: (i) => i.document_type.replace(/_/g, ' ') },
    { header: t('app_detail.file_name'), accessorKey: 'file_name' },
    { header: t('app_detail.version'), accessorKey: 'version_number', cell: (i) => `v${i.version_number}` },
    {
      header: t('app_detail.doc_status'), cell: (i) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${i.validation_status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
          i.validation_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
          {i.validation_status}
        </span>
      )
    },
    {
      header: t('app_detail.actions'), cell: (i: any) => (
        <a href={i.file_url || i.file_path || '#'} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80"><Download className="w-4 h-4" /></a>
      )
    },
  ];

  const neighborColumns: ColumnDef<any>[] = [
    { header: t('app_detail.name_col'), accessorKey: 'neighbor_name' },
    { header: t('app_detail.phone_col'), accessorKey: 'neighbor_phone' },
    { header: t('app_detail.doc_status'), cell: (i: any) => <span className="bg-slate-100 px-2 py-1 rounded text-xs">{i.status}</span> },
    { header: t('app_detail.consent_col'), cell: (i: any) => i.consent_document_url || i.file_url ? <a href={i.consent_document_url || i.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline"><Download className="w-4 h-4 inline mr-1" />{t('app_detail.view')}</a> : <span className="text-slate-400 text-xs">{t('app_detail.no_file')}</span> },
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
          <h1 className="text-2xl font-bold text-slate-800">Application {app.arn || t('app_detail.draft')}</h1>
          <p className="text-slate-500 text-sm">{t('app_detail.created_on')} {format(new Date(app.created_at), 'PPP')}</p>
        </div>
        <div className="flex-1" />
        <StatusBadge status={app.status} size="md" />
        
        {/* Download Permit Button */}
        {hasPermit && permitNumber && (
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPermit}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('app_detail.download_permit')}
            </button>
            <button 
              onClick={handleVerifyPermit}
              className="btn btn-outline inline-flex items-center gap-2"
              title="Public verification page"
            >
              <ExternalLink className="w-4 h-4" />
              {t('app_detail.verify')}
            </button>
          </div>
        )}
        
        {(app.status === 'PAYMENT_PENDING' || app.status === 'PAYMENT_EXPIRED') && (
          <button onClick={handlePayNow} className="btn btn-primary inline-flex items-center gap-2">
            {t('app_detail.pay_fees')}
          </button>
        )}
        {isDraft && (
          <button
            onClick={handleSubmitDraft}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? t('app_detail.submitting') : t('app_detail.submit_app')}
          </button>
        )}
      </div>

      {/* Permit Banner */}
      {hasPermit && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Award className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">
              {app.status === 'PERMIT_ISSUED' ? t('app_detail.permit_issued') : 
               app.status === 'CONSENT_ISSUED' ? t('app_detail.consent_issued') : 
               t('app_detail.completion_issued')}
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              {permitNumber && <>{t('app_detail.permit_number_label')} <strong>{permitNumber}</strong></>}
              {permitData?.issue_date && <> • {t('app_detail.issued_label')} {format(new Date(permitData.issue_date), 'PPP')}</>}
              {permitData?.expiry_date && <> • {t('app_detail.expires_label')} {format(new Date(permitData.expiry_date), 'PPP')}</>}
            </p>
            {loadingPermit && <p className="text-sm text-green-600 mt-1">{t('app_detail.loading_permit')}</p>}
          </div>
        </div>
      )}

      {/* Draft banner */}
      {isDraft && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Edit3 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">{t('app_detail.draft_notice_title')}</p>
            <p className="text-sm text-blue-700 mt-0.5">
              {t('app_detail.draft_notice_desc')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'details', label: t('app_detail.tab_data'), icon: Building },
          { key: 'docs', label: t('app_detail.tab_docs'), icon: FileText },
          { key: 'neighbors', label: t('app_detail.tab_neighbors'), icon: Users },
          { key: 'timeline', label: t('app_detail.tab_timeline'), icon: Clock },
          ...(app.status === 'REVISION_REQUIRED' ? [{ key: 'revision', label: t('app_detail.tab_revisions'), icon: MessageSquare }] : []),
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === key
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
                  <Edit3 className="w-4 h-4" /> {t('app_detail.edit_details')}
                </button>
              </div>
            )}

            {isEditingDetails ? (
              <form onSubmit={handleSubmit(handleSaveDetails)} className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">{t('app_detail.edit_building_title')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="label">{t('app_detail.intended_use_label')}</label>
                    <input type="text" {...register('intended_use', { required: true })} className="input-field" />
                    {errors.intended_use && <p className="text-red-500 text-xs mt-1">{t('app_detail.required_field')}</p>}
                  </div>
                  <div>
                    <label className="label">{t('app_detail.project_value_label')}</label>
                    <input type="number" {...register('project_value_etb', { required: true, valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.height_label')}</label>
                    <input type="number" step="0.1" {...register('height_m', { required: true, valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.floor_area_label')}</label>
                    <input type="number" step="0.1" {...register('floor_area_sqm', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.floors_above_label')}</label>
                    <input type="number" {...register('floors_above', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.floors_below_label')}</label>
                    <input type="number" {...register('floors_below', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="label">{t('app_detail.plot_address_label')}</label>
                    <input type="text" {...register('plot_address')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.subcity_label')}</label>
                    <input type="text" {...register('subcity_id')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.woreda_label')}</label>
                    <input type="text" {...register('woreda')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.gps_lat_label')}</label>
                    <input type="number" step="0.000001" {...register('plot_gps_lat', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.gps_lng_label')}</label>
                    <input type="number" step="0.000001" {...register('plot_gps_lng', { valueAsNumber: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.architect_name_label')}</label>
                    <input type="text" {...register('architect_name')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.architect_license_label')}</label>
                    <input type="text" {...register('architect_license')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.contractor_name_label')}</label>
                    <input type="text" {...register('contractor_name')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('app_detail.contractor_license_label')}</label>
                    <input type="text" {...register('contractor_license')} className="input-field" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={savingDetails} className="btn btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    {savingDetails ? t('app_detail.saving') : t('app_detail.save_changes')}
                  </button>
                  <button type="button" onClick={() => setIsEditingDetails(false)} className="btn btn-outline gap-2">
                    <X className="w-4 h-4" /> {t('app_detail.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  [t('app_detail.detail_intended_use'), app.intended_use],
                  [t('app_detail.detail_category'), app.building_category],
                  [t('app_detail.detail_project_value'), `${(app.project_value_etb || 0).toLocaleString()} ETB`],
                  [t('app_detail.detail_address'), app.plot_address],
                  [t('app_detail.detail_subcity_woreda'), `${app.subcity_id} / ${app.woreda}`],
                  [t('app_detail.detail_height_area'), `${app.height_m}m / ${app.floor_area_sqm} sqm`],
                  [t('app_detail.detail_floors'), `${app.floors_above} / ${app.floors_below}`],
                  [t('app_detail.detail_architect'), `${app.architect_name} (${app.architect_license})`],
                  [t('app_detail.detail_contractor'), app.contractor_name || t('app_detail.no_file')],
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
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">{t('app_detail.uploaded_docs')}</h3>
              <DataTable data={app.documents || []} columns={docColumns} />
            </div>

            {isDraft && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 pt-4 border-t border-slate-100">
                  {t('app_detail.required_docs')}
                </h3>
                {loadingDocs ? (
                  <LoadingSpinner />
                ) : requiredDocs.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">{t('app_detail.all_docs_uploaded')}</p>
                ) : (
                  <div className="space-y-4">
                    {requiredDocs.map((doc, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-800">{doc.label || doc.document_type.replace(/_/g, ' ')}</h4>
                          {doc.uploaded ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" /> {t('app_detail.uploaded_badge')}
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                              {t('app_detail.required_badge')}
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

            {isDraft && (
              <div className="pt-4 border-t border-slate-100">
                {!showAddNeighbor ? (
                  <button
                    onClick={() => setShowAddNeighbor(true)}
                    className="btn btn-outline w-full py-3 border-dashed gap-2"
                  >
                    <PlusCircle className="w-5 h-5" /> {t('app_detail.add_neighbor')}
                  </button>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
                    <h3 className="font-semibold text-slate-800">{t('app_detail.new_neighbor')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">{t('app_detail.neighbor_name_field')}</label>
                        <input
                          type="text"
                          value={neighborForm.name}
                          onChange={(e) => setNeighborForm(p => ({ ...p, name: e.target.value }))}
                          className="input-field"
                          placeholder={t('app_detail.full_name_placeholder')}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">{t('app_detail.phone_field')}</label>
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
                      <label className="label">{t('app_detail.consent_doc_pdf')}</label>
                      <FileUploader
                        onUpload={(files) => setNeighborFile(files[0] ?? null)}
                        acceptedTypes={['application/pdf']}
                        maxSizeMB={10}
                        label=""
                      />
                      {neighborFile && (
                        <p className="text-xs text-green-600 mt-1">{t('app_detail.selected_file')} {neighborFile.name}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddNeighbor}
                        disabled={savingNeighbor}
                        className="btn btn-primary gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {savingNeighbor ? t('app_detail.saving') : t('app_detail.save_consent')}
                      </button>
                      <button
                        onClick={() => { setShowAddNeighbor(false); setNeighborForm({ name: '', phone: '' }); setNeighborFile(null); }}
                        className="btn btn-outline gap-2"
                      >
                        <X className="w-4 h-4" /> {t('app_detail.cancel')}
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
                  {format(new Date(event.created_at), 'PPp')} {t('app_detail.timeline_by')} {event.actor_name}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">
                    {t('app_detail.status_changed')} <span className="text-primary">{event.new_status}</span>
                  </p>
                  {event.note && <p className="text-sm text-slate-600 mt-2">{event.note}</p>}
                </div>
              </div>
            ))}
            {!(app.timeline || app.history)?.length && (
              <p className="text-slate-500 text-sm">{t('app_detail.no_events')}</p>
            )}
          </div>
        )}

        {/* ── TAB: Revisions ── */}
        {activeTab === 'revision' && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-red-700 font-bold">{t('app_detail.revisions_required')}</h3>
                <p className="text-red-600 text-sm mt-1">{t('app_detail.revisions_desc')}</p>
              </div>
            </div>
            {(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').map((comment: any) => (
              <div key={comment.comment_id} className="border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium mr-2">{comment.category}</span>
                    <span className="text-sm text-slate-500">{t('app_detail.from_label')} {comment.author_name}</span>
                  </div>
                </div>
                <p className="text-slate-800 mb-6">{comment.content}</p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t('app_detail.upload_revision')}</p>
                  <FileUploader
                    onUpload={(files) => handleRevisionUpload(files, 'ARCHITECTURAL')}
                    acceptedTypes={['application/pdf']}
                    maxSizeMB={20}
                  />
                </div>
              </div>
            ))}
            {!(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').length && (
              <p className="text-slate-500 text-sm">{t('app_detail.no_open_revisions')}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};