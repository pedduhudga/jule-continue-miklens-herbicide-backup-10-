const fs = require('fs');

let code = fs.readFileSync('src/pages/UserManagement.jsx', 'utf8');

const newCode = `import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useAppState } from '../hooks/useAppState.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { Users, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { getUsers } from '../services/db.js'; // Assuming we have this exported

export default function UserManagement({ onMenuClick }) {
  const { isAdmin } = useAuth();
  const { getAppState } = useAppState();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
       getUsers({}, getAppState).then(data => {
          setUsers(Array.isArray(data) ? data : []);
          setLoading(false);
       }).catch(() => {
          setLoading(false);
       });
    }
  }, [isAdmin, getAppState]);

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
               {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-500">Loading users...</td>
                  </tr>
               ) : users.length > 0 ? (
                 users.map(u => (
                   <tr key={u.id || u.username} className="hover:bg-slate-50 transition">
                     <td className="px-6 py-4">
                       <p className="font-bold text-slate-800">{u.username}</p>
                       <p className="text-xs text-slate-500">{u.id}</p>
                     </td>
                     <td className="px-6 py-4">
                       <span className={\`px-3 py-1 text-xs font-bold rounded-full uppercase \${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}\`}>
                         {u.role || 'user'}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       {u.disabled ? (
                           <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle className="w-4 h-4"/> Disabled</span>
                       ) : (
                           <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-4 h-4"/> Active</span>
                       )}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button className="text-sm font-semibold text-blue-600 hover:underline mr-3">Edit</button>
                       <button className="text-sm font-semibold text-emerald-600 hover:underline">View Data</button>
                     </td>
                   </tr>
                 ))
               ) : (
                  <tr>
                     <td colSpan="4" className="text-center py-8 text-slate-500">No users found or backend integration pending.</td>
                  </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/UserManagement.jsx', newCode);
