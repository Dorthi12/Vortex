'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sliders, CheckCircle, Save, Bell, Globe, TextCursor, Wifi, ShieldCheck, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

interface SelectFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ label, description, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{label}</label>
      {description && <p className="text-[10px] text-slate-450 dark:text-slate-500">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 bg-white dark:bg-[#070D1A] border border-slate-200 dark:border-[#1A2744] rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-[#1A2744] last:border-0">
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
          checked ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export default function AgricultureSettings() {
  const store = useAgricultureStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Control Panel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Agriculture Department Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage regional profiles, translation parameters, notifications and emergency push alerts.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

        {/* Regional & Accessibility */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <Globe className="w-4 h-4 text-emerald-500" />
              Regional &amp; Language Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure language display and regional zone preference.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <SelectField
              label="Preferred Language (Translation)"
              description="All AI advisories will be translated into this language."
              value={store.preferredLanguage}
              onChange={(val) => store.setField('preferredLanguage', val as typeof store.preferredLanguage)}
              options={[
                { value: 'English', label: 'English' },
                { value: 'Hindi', label: 'Hindi (हिन्दी)' },
                { value: 'Tamil', label: 'Tamil (தமிழ்)' },
                { value: 'Telugu', label: 'Telugu (తెలుగు)' },
                { value: 'Marathi', label: 'Marathi (मराठी)' },
                { value: 'Bengali', label: 'Bengali (বাংলা)' },
              ]}
            />

            <SelectField
              label="Primary Agricultural Zone"
              description="Used to localize crop calendars and market data."
              value={store.preferredRegion}
              onChange={(val) => store.setField('preferredRegion', val)}
              options={[
                { value: 'Maharashtra - Western Zone', label: 'Maharashtra - Western Zone' },
                { value: 'Karnataka - Deccan Belt', label: 'Karnataka - Deccan Belt' },
                { value: 'Uttar Pradesh - Gangetic Plain', label: 'Uttar Pradesh - Gangetic Plain' },
                { value: 'Tamil Nadu - Kaveri Delta', label: 'Tamil Nadu - Kaveri Delta' },
                { value: 'Gujarat - Saurashtra Zone', label: 'Gujarat - Saurashtra Zone' },
                { value: 'Punjab - Northern Wheat Belt', label: 'Punjab - Northern Wheat Belt' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <TextCursor className="w-4 h-4 text-emerald-500" />
              Accessibility &amp; Display
            </CardTitle>
            <CardDescription className="text-xs">
              Optimize for visibility and readability in field conditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <SelectField
              label="Accessibility Display Font Size"
              description="Larger text improves readability on mobile devices in bright sunlight."
              value={store.accessibilityFontSize}
              onChange={(val) => store.setField('accessibilityFontSize', val as typeof store.accessibilityFontSize)}
              options={[
                { value: 'Standard', label: 'Standard Text' },
                { value: 'Large', label: 'Large Text (+15%)' },
                { value: 'Extra Large', label: 'Extra Large (+30% — High Readability)' },
              ]}
            />

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Farmer-Friendly Mode
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Farmer-friendly UI uses larger buttons, simplified icons, and local language labels for citizens with low digital literacy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Pipelines */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <Bell className="w-4 h-4 text-emerald-500" />
              Notification Pipelines
            </CardTitle>
            <CardDescription className="text-xs">
              Control how you receive system alerts, advisories, and emergency broadcasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <ToggleRow
              label="SMS Advisory Alerts"
              description="Receive crop advisories and weather warnings via SMS (works offline)."
              checked={store.notificationPreferences.sms}
              onChange={(val) => store.setField('notificationPreferences', { ...store.notificationPreferences, sms: val })}
            />
            <ToggleRow
              label="Push Notification Alarms"
              description="Receive real-time pest outbreak and disease alerts on your device."
              checked={store.notificationPreferences.push}
              onChange={(val) => store.setField('notificationPreferences', { ...store.notificationPreferences, push: val })}
            />
            <ToggleRow
              label="Monthly Email Audit Reports"
              description="Compiled PDF season summaries delivered to your government email."
              checked={store.notificationPreferences.email}
              onChange={(val) => store.setField('notificationPreferences', { ...store.notificationPreferences, email: val })}
            />
          </CardContent>
        </Card>

        {/* Data Sync & Security */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Data Sync &amp; Security
            </CardTitle>
            <CardDescription className="text-xs">
              Manage data export formats and sync pipeline preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <SelectField
              label="Default Report Export Format"
              description="Format used when compiling district and seasonal reports."
              value={store.selectedReportFormat}
              onChange={(val) => store.setField('selectedReportFormat', val as 'PDF' | 'Excel')}
              options={[
                { value: 'PDF', label: 'PDF (Government Standard)' },
                { value: 'Excel', label: 'Excel (.xlsx — Data Analysis)' },
              ]}
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Config
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs flex items-center gap-1 font-semibold cursor-pointer text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
              >
                Clear Cache
              </Button>
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">System Status</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">All data pipelines operational · Last sync: 14 minutes ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Save Action Row */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-150 dark:border-[#1A2744] pt-5 max-w-5xl">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully · Sync will update within 60 seconds
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-xs h-9 cursor-pointer">
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs py-2 h-9 px-4 cursor-pointer font-bold"
          >
            <Save className="w-4 h-4" />
            Save All Preferences
          </Button>
        </div>
      </div>

    </div>
  );
}
