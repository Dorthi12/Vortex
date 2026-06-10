'use client';

import React, { useState } from 'react';
import { useGovStore } from '@/store/useGovStore';
import { Settings, Bell, Moon, Sun, Shield, Globe, Database, Key, Save } from 'lucide-react';

export default function GovSettingsPage() {
  const { govUser } = useGovStore();
  const [notifications, setNotifications] = useState({ email: true, sms: true, push: true, critical: true });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="border-b border-[#1A2744] pb-4">
        <h1 className="text-2xl font-black tracking-wider text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#D4AF37]" />
          Portal Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure government portal preferences and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Account & Security
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Name</label>
              <input className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-2 text-sm text-white" defaultValue={govUser?.name || 'Shri Arjun Mehta'} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Government ID</label>
              <input className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-2 text-sm text-slate-400" defaultValue={govUser?.govId || 'GOV-NAT-0001'} readOnly />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Role</label>
              <input className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-2 text-sm text-slate-400" defaultValue={govUser?.role || 'National Administrator'} readOnly />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Department</label>
              <input className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-2 text-sm text-slate-400" defaultValue={govUser?.department || 'Cabinet Secretariat'} readOnly />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via official email' },
              { key: 'sms', label: 'SMS Alerts', desc: 'Critical alerts via government SMS' },
              { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'critical', label: 'Critical Emergency Alerts', desc: 'Always-on emergency broadcasts' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-[#070D1A] rounded-lg border border-[#1A2744]">
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-[#1A3A6C]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6 bg-[#D4AF37]' : 'translate-x-1 bg-slate-400'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
            <Key className="w-4 h-4" /> Security Settings
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Two-Factor Authentication', status: 'Enabled', color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Session Timeout', status: '30 minutes', color: 'text-blue-400 bg-blue-500/10' },
              { label: 'Audit Logging', status: 'Active', color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'IP Restriction', status: 'Government Network', color: 'text-[#D4AF37] bg-amber-500/10' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-[#070D1A] rounded-lg border border-[#1A2744]">
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System */}
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
            <Database className="w-4 h-4" /> System Information
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Platform Version', value: 'NETRAVAAH v2.4.1' },
              { label: 'Environment', value: 'Production' },
              { label: 'Data Center', value: 'NIC India — Pune Node' },
              { label: 'Last Security Audit', value: 'June 1, 2024' },
              { label: 'Uptime', value: '99.98% (last 30 days)' },
              { label: 'Active Sessions', value: '142 officers' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2 border-b border-[#1A2744]">
                <span className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className="text-xs text-slate-300 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-[#1A3A6C] hover:bg-[#1C39BB] text-white border border-[#D4AF37]/30'}`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
