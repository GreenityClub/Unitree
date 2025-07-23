import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usersIcon, userIcon } from '../../utils/icons';

const AdminsPage: React.FC = () => {
  const { admin } = useAdminAuth();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admins Management</h1>
        <p className="text-gray-600">Manage administrator accounts</p>
        </div>

      <Card variant="primary" className="mb-6">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Administrator List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin?.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin?.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Just now</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button size="sm" variant="secondary" className="mr-2">Edit</Button>
                    </td>
                  </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
      <Card variant="accent">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Add Administrator</h2>
          <p className="mb-4 text-sm">Create a new administrator account with specific permissions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="primary">Create Admin</Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default AdminsPage; 