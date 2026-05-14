import React, { useState } from 'react';
import { Download, Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export const ConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuration updated successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-primary">System Configuration</h1>

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" /> Application Fee Base Rates
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="label">Category A Base Fee (ETB)</label><input type="number" defaultValue={2000} className="input-field" /></div>
            <div><label className="label">Category B Base Fee (ETB)</label><input type="number" defaultValue={4000} className="input-field" /></div>
            <div><label className="label">Category C Base Fee (ETB)</label><input type="number" defaultValue={8000} className="input-field" /></div>
            <div><label className="label">Sqm Multiplier (ETB/m²)</label><input type="number" defaultValue={10} className="input-field" /></div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center mt-8">
            <Settings className="w-5 h-5 mr-2" /> Global Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="maint" className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded" />
              <label htmlFor="maint" className="ml-2 text-sm text-slate-700">Enable Maintenance Mode</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="sms" defaultChecked className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded" />
              <label htmlFor="sms" className="ml-2 text-sm text-slate-700">Enable SMS Notifications</label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-6">
            <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  const handleExport = (type: string) => {
    toast.success(`Exporting ${type} report...`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Data Exports & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Permit Issuance Report</h2>
          <p className="text-slate-600 text-sm mb-4">Detailed log of all permits issued within a date range, including applicant details and fees.</p>
          <button onClick={() => handleExport('permits')} className="btn btn-outline w-full justify-center">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>

        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Revenue Report</h2>
          <p className="text-slate-600 text-sm mb-4">Summary of all fees collected by subcity, category, and payment method.</p>
          <button onClick={() => handleExport('revenue')} className="btn btn-outline w-full justify-center">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </button>
        </div>

        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Performance Audit Log</h2>
          <p className="text-slate-600 text-sm mb-4">Processing times for applications segmented by review officers and subcities.</p>
          <button onClick={() => handleExport('performance')} className="btn btn-outline w-full justify-center">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};
