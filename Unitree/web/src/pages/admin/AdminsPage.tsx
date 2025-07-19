import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLayout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient, { API_ENDPOINTS } from '../../config/api';
import { AdminUser } from '../../types';

const AdminsPage: React.FC = () => {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [permissions, setPermissions] = useState({
    manageAdmins: false,
    manageStudents: true,
    manageTrees: true,
    managePoints: true,
    manageWifiSessions: true,
    manageTreeTypes: true,
    manageRealTrees: true,
    viewStatistics: true
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.GET_ALL);
      if (response.data && response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      setError(error.response?.data?.message || 'Failed to fetch admin accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.CREATE, {
        username,
        password,
        permissions
      });
      
      if (response.data && response.data.success) {
        fetchAdmins();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating admin:', error);
      setError(error.response?.data?.message || 'Failed to create admin account');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAdmin) return;
    
    try {
      setError(null);
      
      const response = await apiClient.put(API_ENDPOINTS.ADMIN.UPDATE(selectedAdmin.id), {
        username,
        permissions
      });
      
      if (response.data && response.data.success) {
        fetchAdmins();
        setShowEditModal(false);
        setSelectedAdmin(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating admin:', error);
      setError(error.response?.data?.message || 'Failed to update admin account');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAdmin) return;
    
    try {
      setError(null);
      
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.RESET_PASSWORD(selectedAdmin.id), {
        newPassword
      });
      
      if (response.data && response.data.success) {
        setShowResetModal(false);
        setSelectedAdmin(null);
        setNewPassword('');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) {
      return;
    }
    
    try {
      setError(null);
      
      const response = await apiClient.delete(API_ENDPOINTS.ADMIN.DELETE(id));
      
      if (response.data && response.data.success) {
        fetchAdmins();
      }
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      setError(error.response?.data?.message || 'Failed to delete admin account');
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setUsername(admin.username);
    setPermissions(admin.permissions);
    setShowEditModal(true);
  };

  const openResetModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setShowResetModal(true);
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setNewPassword('');
    setPermissions({
      manageAdmins: false,
      manageStudents: true,
      manageTrees: true,
      managePoints: true,
      manageWifiSessions: true,
      manageTreeTypes: true,
      manageRealTrees: true,
      viewStatistics: true
    });
  };

  // Check if current user is superadmin
  if (currentAdmin?.role !== 'superadmin') {
    return (
      <AdminLayout>
        <div className="text-center py-10">
          <h1 className="text-2xl font-semibold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to manage admin accounts.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Management</h1>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Admin
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading admin accounts...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {admin.role !== 'superadmin' && (
                        <>
                          <button 
                            onClick={() => openEditModal(admin)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openResetModal(admin)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Reset Password
                          </button>
                          <button 
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {admin.role === 'superadmin' && (
                        <span className="text-gray-400">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No admin accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Admin Account</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Permissions</h3>
                <div className="space-y-2">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`create-${key}`}
                        checked={key === 'manageAdmins' ? false : value}
                        onChange={(e) => setPermissions({
                          ...permissions,
                          [key]: key === 'manageAdmins' ? false : e.target.checked
                        })}
                        disabled={key === 'manageAdmins'}
                        className="mr-2"
                      />
                      <label htmlFor={`create-${key}`} className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        {key === 'manageAdmins' && <span className="text-red-600"> (Super Admin only)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Admin: {selectedAdmin.username}</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Permissions</h3>
                <div className="space-y-2">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-${key}`}
                        checked={key === 'manageAdmins' ? false : value}
                        onChange={(e) => setPermissions({
                          ...permissions,
                          [key]: key === 'manageAdmins' ? false : e.target.checked
                        })}
                        disabled={key === 'manageAdmins'}
                        className="mr-2"
                      />
                      <label htmlFor={`edit-${key}`} className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        {key === 'manageAdmins' && <span className="text-red-600"> (Super Admin only)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Reset Password: {selectedAdmin.username}</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handlePasswordReset}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedAdmin(null);
                    setNewPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Reset Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminsPage; 