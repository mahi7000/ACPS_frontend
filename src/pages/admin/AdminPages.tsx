import React, { useState, useEffect } from 'react';
import { Download, Save, Settings, FileText } from 'lucide-react';
import { adminApi } from '@/services/api/admin';
import toast from 'react-hot-toast';

export const ConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Fee Schedule State
  const [feeSchedule, setFeeSchedule] = useState({
    effective_from: new Date().toISOString(),
    tiers: [
      { min_value_etb: 0, max_value_etb: 2500000, calculation_formula: 'FIXED', rate: 0.0005, fixed_fee: 0, planning_consent_fee: 300 },
      { min_value_etb: 2500000, max_value_etb: 5000000, calculation_formula: 'PERCENTAGE', rate: 0.0004, fixed_fee: 1250, planning_consent_fee: 500 },
      { min_value_etb: 5000000, max_value_etb: null, calculation_formula: 'PERCENTAGE', rate: 0.0003, fixed_fee: 3250, planning_consent_fee: 1000 }
    ]
  });

  // SLA State
  const [slaConfig, setSlaConfig] = useState({
    effective_from: new Date().toISOString(),
    thresholds: {
      TECHNICAL_REVIEW_DAYS: 10,
      REVISION_RESPONSE_DAYS: 7,
      SENIOR_APPROVAL_DAYS: 5,
      INSPECTION_SCHEDULING_DAYS: 3,
      FINAL_COMPLETION_DAYS: 7
    },
    reminder_days: {
      TECHNICAL_REVIEW_REMINDER: 7,
      PAYMENT_REMINDER: 2,
      INSPECTION_REMINDER: 2
    }
  });

  useEffect(() => {
    setInitialLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.updateFeeSchedule(feeSchedule);
      await adminApi.updateSlaThresholds(slaConfig);
      toast.success('Configuration updated successfully');
    } catch (err) {
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-primary">System Configuration</h1>

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-8">
          
          <div>
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" /> Fee Schedule Tiers
            </h2>
            <div className="space-y-4">
              {feeSchedule.tiers.map((tier, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-700 mb-3">Tier {idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Min Value (ETB)</label>
                      <input type="number" value={tier.min_value_etb} onChange={(e) => {
                        const newTiers = [...feeSchedule.tiers];
                        newTiers[idx].min_value_etb = Number(e.target.value);
                        setFeeSchedule({...feeSchedule, tiers: newTiers});
                      }} className="input-field" />
                    </div>
                    <div>
                      <label className="label">Rate / Multiplier</label>
                      <input type="number" step="0.0001" value={tier.rate} onChange={(e) => {
                        const newTiers = [...feeSchedule.tiers];
                        newTiers[idx].rate = Number(e.target.value);
                        setFeeSchedule({...feeSchedule, tiers: newTiers});
                      }} className="input-field" />
                    </div>
                    <div>
                      <label className="label">Fixed Fee (ETB)</label>
                      <input type="number" value={tier.fixed_fee} onChange={(e) => {
                        const newTiers = [...feeSchedule.tiers];
                        newTiers[idx].fixed_fee = Number(e.target.value);
                        setFeeSchedule({...feeSchedule, tiers: newTiers});
                      }} className="input-field" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" /> SLA Thresholds (Days)
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="label">Technical Review Days</label>
                <input type="number" value={slaConfig.thresholds.TECHNICAL_REVIEW_DAYS} onChange={e => setSlaConfig({
                  ...slaConfig, thresholds: { ...slaConfig.thresholds, TECHNICAL_REVIEW_DAYS: Number(e.target.value) }
                })} className="input-field" />
              </div>
              <div>
                <label className="label">Senior Approval Days</label>
                <input type="number" value={slaConfig.thresholds.SENIOR_APPROVAL_DAYS} onChange={e => setSlaConfig({
                  ...slaConfig, thresholds: { ...slaConfig.thresholds, SENIOR_APPROVAL_DAYS: Number(e.target.value) }
                })} className="input-field" />
              </div>
              <div>
                <label className="label">Revision Response Days</label>
                <input type="number" value={slaConfig.thresholds.REVISION_RESPONSE_DAYS} onChange={e => setSlaConfig({
                  ...slaConfig, thresholds: { ...slaConfig.thresholds, REVISION_RESPONSE_DAYS: Number(e.target.value) }
                })} className="input-field" />
              </div>
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
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState({
    report_type: 'APPLICATIONS',
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    format: 'csv'
  });

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    toast.success(`Generating ${reportData.report_type} report...`);
    try {
      const blob = await adminApi.exportReport({
        report_type: reportData.report_type,
        date_from: reportData.date_from,
        date_to: reportData.date_to,
        format: reportData.format
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportData.report_type.toLowerCase()}_report_${new Date().getTime()}.${reportData.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (err: any) {
      console.error('Report export error:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-primary">Data Exports & Reports</h1>

      <div className="card p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2" /> Report Generator
        </h2>
        
        <form onSubmit={handleExport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Report Type</label>
              <select 
                className="input-field"
                value={reportData.report_type}
                onChange={(e) => setReportData({...reportData, report_type: e.target.value})}
              >
                <option value="APPLICATIONS">Applications</option>
                <option value="PAYMENTS">Payments</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="SLA_BREACHES">SLA Breaches</option>
                <option value="USER_ACTIVITY">User Activity</option>
              </select>
            </div>
            <div>
              <label className="label">Format</label>
              <select 
                className="input-field"
                value={reportData.format}
                onChange={(e) => setReportData({...reportData, format: e.target.value})}
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="json">JSON (Data)</option>
              </select>
            </div>
            <div>
              <label className="label">Date From</label>
              <input 
                type="date" 
                required
                className="input-field"
                value={reportData.date_from}
                onChange={(e) => setReportData({...reportData, date_from: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Date To</label>
              <input 
                type="date" 
                required
                className="input-field"
                value={reportData.date_to}
                onChange={(e) => setReportData({...reportData, date_to: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={exporting}
            className="btn btn-primary w-full justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> {exporting ? 'Generating...' : 'Generate & Download Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
