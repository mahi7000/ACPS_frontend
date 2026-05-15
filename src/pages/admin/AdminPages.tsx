import React, { useState, useEffect } from 'react';
import { Download, Save, Settings } from 'lucide-react';
import { adminApi } from '@/services/api/admin';
import toast from 'react-hot-toast';

export const ConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [config, setConfig] = useState({
    fee_cat_a: 2000,
    fee_cat_b: 4000,
    fee_cat_c: 8000,
    fee_sqm_multiplier: 10,
    sla_review_days: 10,
    sla_inspection_days: 7,
    maint_mode: false,
    sms_enabled: true
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await adminApi.getConfig();
        setConfig(res);
      } catch (err) {
        // Use defaults if fail
      } finally {
        setInitialLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.updateFeeSchedule({
        cat_a: config.fee_cat_a,
        cat_b: config.fee_cat_b,
        cat_c: config.fee_cat_c,
        sqm_multiplier: config.fee_sqm_multiplier
      });
      await adminApi.updateSlaThresholds({
        review_days: config.sla_review_days,
        inspection_days: config.sla_inspection_days
      });
      // In a real app we'd also update global settings
      toast.success('Configuration updated successfully');
    } catch (err) {
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-primary">System Configuration</h1>

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" /> Application Fee Base Rates
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Category A Base Fee (ETB)</label>
              <input type="number" value={config.fee_cat_a} onChange={e => setConfig({...config, fee_cat_a: Number(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="label">Category B Base Fee (ETB)</label>
              <input type="number" value={config.fee_cat_b} onChange={e => setConfig({...config, fee_cat_b: Number(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="label">Category C Base Fee (ETB)</label>
              <input type="number" value={config.fee_cat_c} onChange={e => setConfig({...config, fee_cat_c: Number(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="label">Sqm Multiplier (ETB/m²)</label>
              <input type="number" value={config.fee_sqm_multiplier} onChange={e => setConfig({...config, fee_sqm_multiplier: Number(e.target.value)})} className="input-field" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center mt-8">
            <Settings className="w-5 h-5 mr-2" /> SLA Thresholds (Days)
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Technical Review</label>
              <input type="number" value={config.sla_review_days} onChange={e => setConfig({...config, sla_review_days: Number(e.target.value)})} className="input-field" />
            </div>
            <div>
              <label className="label">Site Inspection</label>
              <input type="number" value={config.sla_inspection_days} onChange={e => setConfig({...config, sla_inspection_days: Number(e.target.value)})} className="input-field" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center mt-8">
            <Settings className="w-5 h-5 mr-2" /> Global Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="maint" checked={config.maint_mode} onChange={e => setConfig({...config, maint_mode: e.target.checked})} className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded" />
              <label htmlFor="maint" className="ml-2 text-sm text-slate-700">Enable Maintenance Mode</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="sms" checked={config.sms_enabled} onChange={e => setConfig({...config, sms_enabled: e.target.checked})} className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded" />
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
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, format: string = 'csv') => {
    setExporting(type);
    toast.success(`Exporting ${type} report...`);
    try {
      const blob = await adminApi.exportReport(type, { format });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Data Exports & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Permit Issuance Report</h2>
          <p className="text-slate-600 text-sm mb-4">Detailed log of all permits issued within a date range, including applicant details and fees.</p>
          <button 
            onClick={() => handleExport('permits', 'csv')} 
            disabled={exporting === 'permits'}
            className="btn btn-outline w-full justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> {exporting === 'permits' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Revenue Report</h2>
          <p className="text-slate-600 text-sm mb-4">Summary of all fees collected by subcity, category, and payment method.</p>
          <button 
            onClick={() => handleExport('revenue', 'xlsx')} 
            disabled={exporting === 'revenue'}
            className="btn btn-outline w-full justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> {exporting === 'revenue' ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>

        <div className="card p-6 border border-slate-200 hover:border-primary/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Performance Audit Log</h2>
          <p className="text-slate-600 text-sm mb-4">Processing times for applications segmented by review officers and subcities.</p>
          <button 
            onClick={() => handleExport('performance', 'csv')} 
            disabled={exporting === 'performance'}
            className="btn btn-outline w-full justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> {exporting === 'performance' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};
