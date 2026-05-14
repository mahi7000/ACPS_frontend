import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/api/client';
import toast from 'react-hot-toast';
import { User, Shield, FileText, } from 'lucide-react';
import { FileUploader } from '@/components/forms/FileUploader';
import { format } from 'date-fns';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      subcity_id: user?.subcity_id || '',
      tin: user?.tin || '',
    }
  });

  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get('/users/me/documents/');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab !== 'personal') {
      fetchDocuments();
    }
  }, [activeTab]);

  const onProfileSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await apiClient.put('/users/me/', data);
      setUser(res.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (files: File[], docType: string) => {
    if (!files.length) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('document_type', docType);

    try {
      await apiClient.post('/users/me/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${docType.replace('_', ' ')} uploaded successfully`);
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to upload document');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">Profile & Document Vault</h1>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'personal' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'
          }`}
        >
          <div className="flex items-center justify-center">
            <User className="w-4 h-4 mr-2" />
            Personal Info
          </div>
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'verification' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'
          }`}
        >
          <div className="flex items-center justify-center">
            <Shield className="w-4 h-4 mr-2" />
            Verification Docs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'vault' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-primary'
          }`}
        >
          <div className="flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Document Vault
          </div>
        </button>
      </div>

      <div className="card p-6">
        {activeTab === 'personal' && (
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6 max-w-xl">
            <div>
              <label className="label">Full Name</label>
              <input type="text" {...register('full_name')} className="input-field" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" {...register('phone')} className="input-field" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={user?.email} disabled className="input-field bg-slate-100" />
            </div>
            <div>
              <label className="label">Subcity</label>
              <input type="text" {...register('subcity_id')} className="input-field" />
            </div>
            <div>
              <label className="label">TIN Number</label>
              <input type="text" {...register('tin')} className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">National ID / Passport</h3>
                <FileUploader 
                  onUpload={(files) => handleDocumentUpload(files, 'NATIONAL_ID')} 
                  acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']} 
                  maxSizeMB={5}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-4">TIN Certificate</h3>
                <FileUploader 
                  onUpload={(files) => handleDocumentUpload(files, 'TIN_CERTIFICATE')} 
                  acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']} 
                  maxSizeMB={5}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Uploaded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc.document_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{doc.document_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3">{doc.file_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          doc.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                          doc.status === 'REJECTED' ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">v{doc.version_number}</td>
                      <td className="px-4 py-3">{format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}</td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No documents found in your vault.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
