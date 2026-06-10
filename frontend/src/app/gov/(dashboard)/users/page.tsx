'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, GovUser } from '@/store/useGovStore';
import {
  UserCog, UserPlus, ShieldAlert, CheckCircle, Search, Filter,
  Trash2, Edit, Ban, Key, CheckSquare, Square, Eye, ShieldCheck
} from 'lucide-react';

const ROLE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  'National Administrator': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-700/40' },
  'Ministry Official':      { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-700/40'  },
  'District Collector':     { bg: 'bg-teal-500/10',  text: 'text-teal-400',  border: 'border-teal-700/40'  },
  'Department Head':        { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-700/40' },
  'Emergency Operations Officer': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-700/40' },
  'State Official':         { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-700/40' },
};

function getRoleStyle(role: string) {
  return ROLE_CONFIG[role] || { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-700/40' };
}

export default function GovUserManagementPage() {
  const router = useRouter();
  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);
  const users = useGovStore(s => s.users);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserGovId, setNewUserGovId] = useState('');
  const [newUserRole, setNewUserRole] = useState('Ministry Official');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserDist, setNewUserDist] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['reports']);

  useEffect(() => {
    if (!isGovAuthenticated) {
      router.replace('/gov/login');
    }
  }, [isGovAuthenticated, router]);

  if (!isGovAuthenticated) {
    return null;
  }

  // Filtered list
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.govId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI count
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const inactiveUsers = users.filter(u => u.status === 'Inactive').length;
  const suspendedUsers = users.filter(u => u.status === 'Suspended').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/40';
      case 'Inactive': return 'text-slate-400 bg-slate-900/50 border border-slate-800/40';
      default: return 'text-red-400 bg-red-950/40 border border-red-900/40';
    }
  };

  const handleTogglePermission = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserGovId.trim()) return;

    // Simulate creation
    alert(`Successfully registered secure account for ${newUserName} [Gov ID: ${newUserGovId}]`);
    setShowAddModal(false);
    // Reset Form
    setNewUserName('');
    setNewUserGovId('');
    setNewUserDept('');
    setNewUserDist('');
    setNewUserEmail('');
    setNewUserPhone('');
    setSelectedPermissions(['reports']);
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center">
            <UserCog className="mr-2.5 text-[#D4AF37]" size={24} />
            User Management Registry
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Configure secure access credentials, department scopes, and permission roles for operations officers.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#1C39BB] hover:bg-[#244bd5] border border-[#1C39BB] text-xs font-bold text-white rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <UserPlus size={14} />
            <span>Add Government Officer</span>
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Accounts</span>
          <span className="text-lg font-bold text-white block mt-0.5">{totalUsers} Officers</span>
        </div>
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Active Sessions</span>
          <span className="text-lg font-bold text-emerald-400 block mt-0.5">{activeUsers} Online</span>
        </div>
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Offline Status</span>
          <span className="text-lg font-bold text-slate-400 block mt-0.5">{inactiveUsers} Inactive</span>
        </div>
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md">
          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Security Revoked</span>
          <span className="text-lg font-bold text-red-400 block mt-0.5">{suspendedUsers} Suspended</span>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl overflow-hidden shadow-lg">
        
        {/* Table Filters */}
        <div className="p-4 bg-[#070D1A]/30 border-b border-[#1A2744]/75 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by officer name or government ID..."
              className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex items-center space-x-1.5 bg-[#070D1A] border border-[#1A2744] rounded-lg px-2.5 py-1">
              <span className="text-[10px] text-slate-500">Scope Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-semibold outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#0A1228]">All Roles</option>
                <option value="National Administrator" className="bg-[#0A1228]">National Admin</option>
                <option value="Ministry Official" className="bg-[#0A1228]">Ministry Official</option>
                <option value="District Collector" className="bg-[#0A1228]">District Collector</option>
                <option value="Department Head" className="bg-[#0A1228]">Department Head</option>
                <option value="Emergency Operations Officer" className="bg-[#0A1228]">Emergency Officer</option>
                <option value="State Official" className="bg-[#0A1228]">State Official</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-[#070D1A] border border-[#1A2744] rounded-lg px-2.5 py-1">
              <span className="text-[10px] text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-semibold outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#0A1228]">All States</option>
                <option value="Active" className="bg-[#0A1228]">Active</option>
                <option value="Inactive" className="bg-[#0A1228]">Inactive</option>
                <option value="Suspended" className="bg-[#0A1228]">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1A2744] bg-[#070D1A]/55 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4 font-mono">Government ID</th>
                <th className="py-3.5 px-4">Officer Name</th>
                <th className="py-3.5 px-4">Governance Role</th>
                <th className="py-3.5 px-4">Department Scope</th>
                <th className="py-3.5 px-4">Location Jurisdiction</th>
                <th className="py-3.5 px-4">Audit Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2744]/40 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const roleStyle = getRoleStyle(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-[#121E3D]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">{user.govId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{user.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{user.department}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{user.district}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-1 hover:bg-[#121E3D] text-slate-400 hover:text-white rounded transition-colors" title="View details">
                            <Eye size={14} />
                          </button>
                          <button className="p-1 hover:bg-[#121E3D] text-slate-400 hover:text-white rounded transition-colors" title="Edit credentials">
                            <Edit size={14} />
                          </button>
                          <button className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded transition-colors" title="Suspend Session">
                            <Ban size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No officer accounts found matching selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD USER MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#1A2744] flex justify-between items-center bg-[#070D1A]/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <UserPlus size={16} className="mr-2 text-[#D4AF37]" />
                Register Government Personnel
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Official Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Shri Arjun Mehta"
                    className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Government ID</label>
                  <input
                    type="text"
                    value={newUserGovId}
                    onChange={(e) => setNewUserGovId(e.target.value)}
                    placeholder="e.g. GOV-NAT-0001"
                    className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Scope Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-[#070D1A] border border-[#1A2744] text-white text-xs font-semibold rounded-lg p-2.5 outline-none focus:border-[#D4AF37]"
                  >
                    <option value="National Administrator">National Admin</option>
                    <option value="Ministry Official">Ministry Official</option>
                    <option value="District Collector">District Collector</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Emergency Operations Officer">Emergency Officer</option>
                    <option value="State Official">State Official</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Department Scope</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="e.g. Cabinet Secretariat"
                    className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Official Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. name@nic.in"
                    className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jurisdiction District/State</label>
                  <input
                    type="text"
                    value={newUserDist}
                    onChange={(e) => setNewUserDist(e.target.value)}
                    placeholder="e.g. Pune / Maharashtra"
                    className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2.5">Scope Access Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-[#070D1A] border border-[#1A2744] rounded-lg p-3">
                  {[
                    { key: 'reports', label: 'Generate Reports' },
                    { key: 'policies', label: 'Modify Policies' },
                    { key: 'complaints', label: 'Manage Complaints' },
                    { key: 'resources', label: 'Allocate Resources' },
                    { key: 'emergency', label: 'Broadcast Signals' },
                    { key: 'users', label: 'User Provisioning' }
                  ].map(perm => {
                    const active = selectedPermissions.includes(perm.key);
                    return (
                      <button
                        type="button"
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`flex items-center space-x-2 text-left p-1.5 rounded text-[11px] font-semibold transition-colors ${
                          active ? 'text-white' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {active ? <CheckSquare size={14} className="text-[#D4AF37]" /> : <Square size={14} />}
                        <span>{perm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#1A2744]/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-slate-900 border border-[#1A2744] rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1C39BB] hover:bg-[#244bd5] text-xs font-bold text-white rounded-lg transition-colors flex items-center space-x-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>Authorize Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
