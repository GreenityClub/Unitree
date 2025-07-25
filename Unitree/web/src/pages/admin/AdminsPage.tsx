import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { usersIcon, userIcon, editIcon, deleteIcon } from '../../utils/icons';
import apiClient, { API_ENDPOINTS } from '../../config/api';
import { Navigate } from 'react-router-dom';

interface Admin {
  _id: string;
  username: string;
  role: string;
  permissions: {
    manageAdmins: boolean;
    manageStudents: boolean;
    manageTrees: boolean;
    managePoints: boolean;
    manageWifiSessions: boolean;
    manageTreeTypes: boolean;
    manageRealTrees: boolean;
    viewStatistics: boolean;
  };
  lastLogin?: string;
}

const AdminsPage: React.FC = () => {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  
  // Check if current user is a superadmin
  const isSuperAdmin = currentAdmin?.role === 'superadmin';
  
  // Form state for creating a new admin
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    role: 'admin',
    permissions: {
      manageAdmins: false,
      manageStudents: true,
      manageTrees: true,
      managePoints: true,
      manageWifiSessions: true,
      manageTreeTypes: true,
      manageRealTrees: true,
      viewStatistics: true
    }
  });
  
  // Form validation state
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.GET_ALL);
      
      setAdmins(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load admin accounts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    // Basic validation
    if (!newAdmin.username || !newAdmin.password) {
      setFormError('Username and password are required');
      return;
    }
    
    if (newAdmin.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      setFormError('');
      await apiClient.post(API_ENDPOINTS.ADMIN.CREATE, newAdmin);
      
      setShowCreateModal(false);
      
      // Reset form
      setNewAdmin({
        username: '',
        password: '',
        role: 'admin',
        permissions: {
          manageAdmins: false,
          manageStudents: true,
          manageTrees: true,
          managePoints: true,
          manageWifiSessions: true,
          manageTreeTypes: true,
          manageRealTrees: true,
          viewStatistics: true
        }
      });
      
      // Refresh the list
      fetchAdmins();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      setFormError(err.response?.data?.message || 'Failed to create admin account');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    
    try {
      await apiClient.delete(API_ENDPOINTS.ADMIN.DELETE(adminToDelete._id));
      
      setShowDeleteModal(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (err: any) {
      console.error('Error deleting admin:', err);
      alert(err.response?.data?.message || 'Failed to delete admin account');
    }
  };

  const openDeleteModal = (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const canManageAdmins = isSuperAdmin || currentAdmin?.permissions?.manageAdmins;
  
  // If not a superadmin, redirect to dashboard
  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admins Management</h1>
        <p className="text-gray-600">Manage administrator accounts</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card variant="danger" className="mb-6">
          <div className="p-4">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        </Card>
      ) : (
        <Card variant="primary" className="mb-6">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Administrator List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {admin.username}
                        {currentAdmin?._id === admin._id && <span className="ml-2 text-xs text-primary">(You)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          admin.role === 'superadmin' ? 'bg-accent-light text-accent-dark' : 'bg-primary-light text-primary'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.role === 'superadmin' ? (
                          <span className="text-accent">All permissions</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(admin.permissions || {})
                              .filter(([_, value]) => value)
                              .map(([key]) => (
                                <span key={key} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {key.replace('manage', '')}
                                </span>
                              ))
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canManageAdmins && (
                          <>
                            {/* Don't allow deleting yourself or if you're not a superadmin and the target is a superadmin */}
                            {currentAdmin?._id !== admin._id && 
                             !(admin.role === 'superadmin' && currentAdmin?.role !== 'superadmin') && (
                              <Button 
                                size="sm" 
                                variant="danger" 
                                className="ml-2"
                                onClick={() => openDeleteModal(admin)}
                              >
                                <Icon icon={deleteIcon} />
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
      
      {canManageAdmins && (
        <Card variant="accent">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Add Administrator</h2>
            <p className="mb-4 text-sm">Create a new administrator account with specific permissions.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Admin
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Admin Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Admin"
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {formError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={newAdmin.role}
              onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
              disabled={currentAdmin?.role !== 'superadmin'}
            >
              <option value="admin">Admin</option>
              {currentAdmin?.role === 'superadmin' && (
                <option value="superadmin">Super Admin</option>
              )}
            </select>
          </div>
          
          {newAdmin.role !== 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {Object.entries(newAdmin.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => 
                        setNewAdmin({
                          ...newAdmin, 
                          permissions: {
                            ...newAdmin.permissions,
                            [key]: e.target.checked
                          }
                        })
                      }
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-2 block text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateAdmin}>
              Create Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete admin <strong>{adminToDelete?.username}</strong>?</p>
          <p className="text-sm text-red-600">This action cannot be undone.</p>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAdmin}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminsPage; 