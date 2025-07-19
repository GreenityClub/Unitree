import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="w-64 bg-white shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/admin/admins" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Admins
              </a>
            </li>
            <li>
              <a href="/admin/students" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Students
              </a>
            </li>
            <li>
              <a href="/admin/trees" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Trees
              </a>
            </li>
            <li>
              <a href="/admin/tree-types" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Tree Types
              </a>
            </li>
            <li>
              <a href="/admin/real-trees" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Real Trees
              </a>
            </li>
            <li>
              <a href="/admin/points" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Points
              </a>
            </li>
            <li>
              <a href="/admin/wifi-sessions" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                WiFi Sessions
              </a>
            </li>
            <li>
              <a href="/admin/statistics" className="block px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                Statistics
              </a>
            </li>
            <li>
              <button 
                onClick={() => {
                  localStorage.removeItem('adminAuthToken');
                  localStorage.removeItem('admin');
                  window.location.href = '/admin/login';
                }}
                className="block w-full text-left px-4 py-2 rounded hover:bg-gray-200 transition-colors text-red-600"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}; 