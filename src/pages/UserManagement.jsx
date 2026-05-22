import React from 'react';
import TopBar from '../components/TopBar.jsx';
import { useAppState } from '../hooks/useAppState.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { Users, ShieldAlert } from 'lucide-react';

export default function UserManagement({ onMenuClick }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar title="User Management" onMenuClick={onMenuClick} />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-600">You must be an administrator to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="User Management" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">Manage application access, view user data, and assign administrative roles.</p>
          <button className="btn-primary px-4 py-2 rounded-xl shadow flex items-center gap-2">
            Add User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b">
               <tr>
                 <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                 <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
                 <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                 <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               <tr className="hover:bg-slate-50 transition">
                 <td className="px-6 py-4">
                   <p className="font-bold text-slate-800">Admin User</p>
                   <p className="text-xs text-slate-500">admin@example.com</p>
                 </td>
                 <td className="px-6 py-4">
                   <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase">Admin</span>
                 </td>
                 <td className="px-6 py-4">
                   <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active</span>
                 </td>
                 <td className="px-6 py-4 text-right">
                   <button className="text-sm font-semibold text-blue-600 hover:underline mr-3">Edit</button>
                   <button className="text-sm font-semibold text-emerald-600 hover:underline">View Data</button>
                 </td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
