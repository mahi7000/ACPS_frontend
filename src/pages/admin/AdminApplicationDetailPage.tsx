import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsApi } from '@/services/api/applications';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef } from '@/components/tables/DataTable';
import { format } from 'date-fns';
import { 
  Building, FileText, Users, Clock, MessageSquare, 
  Download, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const fetchDetail = async () => {
    try {
      const data = await applicationsApi.getById(id!);
      setApp(data);
    } catch (err) {
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!app) return <div>Application not found</div>;

  const docColumns: ColumnDef<any>[] = [
    { header: 'Type', accessorKey: 'document_type', cell: (i) => i.document_type.replace('_', ' ') },
    { header: 'Name', accessorKey: 'file_name' },
    { header: 'Version', accessorKey: 'version_number', cell: (i) => `v${i.version_number}` },
    { header: 'Status', cell: (i) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        i.validation_status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
        i.validation_status === 'REJECTED' ? 'bg-danger/10 text-danger' :
        'bg-warning/10 text-warning'
      }`}>
        {i.validation_status}
      </span>
    )},
    { header: 'Actions', cell: (i) => (
      <a href={i.file_url || '#'} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80"><Download className="w-4 h-4" /></a>
    )},
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/admin/applications" className="text-slate-500 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Application {app.arn || 'Pending'}</h1>
          <p className="text-slate-500 text-sm">Created on {app.created_at ? format(new Date(app.created_at), 'PPP') : 'N/A'}</p>
        </div>
        <div className="flex-1" />
        <StatusBadge status={app.status} size="md" />
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        <button onClick={() => setActiveTab('details')} className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'details' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'}`}>
          <div className="flex items-center justify-center"><Building className="w-4 h-4 mr-2" /> Data</div>
        </button>
        <button onClick={() => setActiveTab('docs')} className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'docs' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'}`}>
          <div className="flex items-center justify-center"><FileText className="w-4 h-4 mr-2" /> Documents</div>
        </button>
        <button onClick={() => setActiveTab('neighbors')} className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'neighbors' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'}`}>
          <div className="flex items-center justify-center"><Users className="w-4 h-4 mr-2" /> Neighbors</div>
        </button>
        <button onClick={() => setActiveTab('timeline')} className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'timeline' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'}`}>
          <div className="flex items-center justify-center"><Clock className="w-4 h-4 mr-2" /> Timeline</div>
        </button>
        {app.status === 'REVISION_REQUIRED' && (
          <button onClick={() => setActiveTab('revision')} className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'revision' ? 'bg-danger text-white shadow-sm' : 'text-danger hover:bg-danger/10'}`}>
            <div className="flex items-center justify-center"><MessageSquare className="w-4 h-4 mr-2" /> Revisions</div>
          </button>
        )}
      </div>

      <div className="card p-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><p className="text-sm text-slate-500">Applicant</p><p className="font-medium">{app.applicant_name || 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Intended Use</p><p className="font-medium">{app.intended_use || 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Category</p><p className="font-medium">{app.building_category || 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Project Value</p><p className="font-medium">{app.project_value_etb || 0} ETB</p></div>
            <div><p className="text-sm text-slate-500">Address</p><p className="font-medium">{app.plot_address || 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Subcity / Woreda</p><p className="font-medium">{app.subcity_id} / {app.woreda}</p></div>
            <div><p className="text-sm text-slate-500">Height / Area</p><p className="font-medium">{app.height_m}m / {app.floor_area_sqm} sqm</p></div>
            <div><p className="text-sm text-slate-500">Architect</p><p className="font-medium">{app.architect_name || 'N/A'} ({app.architect_license || 'N/A'})</p></div>
            <div><p className="text-sm text-slate-500">Contractor</p><p className="font-medium">{app.contractor_name || 'N/A'}</p></div>
          </div>
        )}

        {activeTab === 'docs' && (
          <DataTable data={app.documents || []} columns={docColumns} />
        )}

        {activeTab === 'neighbors' && (
          <DataTable 
            data={app.neighbors || []} 
            columns={[
              { header: 'Name', accessorKey: 'neighbor_name' },
              { header: 'Phone', accessorKey: 'neighbor_phone' },
              { header: 'Status', cell: (i: any) => <span className="bg-slate-100 px-2 py-1 rounded text-xs">{i.status}</span> },
              { header: 'Consent', cell: (i: any) => i.consent_document_url ? <a href={i.consent_document_url} target="_blank" rel="noreferrer" className="text-primary hover:underline"><Download className="w-4 h-4 inline mr-1" /> View</a> : <span className="text-slate-400 text-xs">No file</span> }
            ]} 
          />
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6 pl-4 border-l-2 border-slate-200 ml-4 py-2">
            {(app.timeline || app.history || []).map((event: any, idx: number) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                <p className="text-sm text-slate-500 mb-1">
                  {event.created_at ? format(new Date(event.created_at), 'PPp') : 'Unknown Date'} by {event.actor_name || 'System'}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">Status changed to <span className="text-primary">{event.new_status}</span></p>
                  {event.note && <p className="text-sm text-slate-600 mt-2">{event.note}</p>}
                </div>
              </div>
            ))}
            {!(app.timeline || app.history)?.length && <p className="text-slate-500">No timeline events found.</p>}
          </div>
        )}

        {activeTab === 'revision' && (
          <div className="space-y-6">
            {(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').map((comment: any) => (
              <div key={comment.comment_id} className="border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium mr-2">{comment.category}</span>
                    <span className="text-sm text-slate-500">From {comment.author_name}</span>
                  </div>
                </div>
                <p className="text-slate-800 mb-6">{comment.content}</p>
              </div>
            ))}
            {!(app.comments || []).filter((c: any) => c.resolution_status === 'OPEN').length && (
              <p className="text-slate-500">No open revisions.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
