import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../contexts/ToastContext';
import { 
  settingsIcon, saveIcon, exclamationCircleIcon, 
  clockIcon, wifiIcon, bellIcon, lockIcon,
  cloudUploadIcon, databaseIcon, userIcon
} from '../../utils/icons';

interface SystemSettings {
  pointsPerMinute: number;
  minSessionDuration: number;
  maxDailyPoints: number;
  treeCostMultiplier: number;
  allowGuestAccounts: boolean;
  maintenanceMode: boolean;
  notificationFrequency: 'instant' | 'hourly' | 'daily';
  adminEmailNotifications: boolean;
  requireEmailVerification: boolean;
  autoDeleteInactiveTrees: boolean;
  autoDeleteDays: number;
  apiRateLimit: number;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    pointsPerMinute: 2,
    minSessionDuration: 15,
    maxDailyPoints: 500,
    treeCostMultiplier: 1.5,
    allowGuestAccounts: true,
    maintenanceMode: false,
    notificationFrequency: 'daily',
    adminEmailNotifications: true,
    requireEmailVerification: true,
    autoDeleteInactiveTrees: false,
    autoDeleteDays: 90,
    apiRateLimit: 100
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEdited, setIsEdited] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const { showToast } = useToast();
  
  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          // In a real app, this would be fetched from the API
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));
    
    setIsEdited(true);
  };
  
  // Handle toggle changes
  const handleToggleChange = (name: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
    
    setIsEdited(true);
  };
  
  // Save settings
  const saveSettings = () => {
    // Simulate API call
    setTimeout(() => {
      showToast('Settings saved successfully.', 'success');
      setIsEdited(false);
    }, 500);
  };
  
  // Reset settings to defaults
  const resetToDefaults = () => {
    setSettings({
      pointsPerMinute: 2,
      minSessionDuration: 15,
      maxDailyPoints: 500,
      treeCostMultiplier: 1.5,
      allowGuestAccounts: true,
      maintenanceMode: false,
      notificationFrequency: 'daily',
      adminEmailNotifications: true,
      requireEmailVerification: true,
      autoDeleteInactiveTrees: false,
      autoDeleteDays: 90,
      apiRateLimit: 100
    });
    
    showToast('Settings reset to defaults.', 'success');
    setIsEdited(true);
    setShowResetModal(false);
  };
  
  // Enable maintenance mode
  const enableMaintenanceMode = () => {
    setSettings(prev => ({
      ...prev,
      maintenanceMode: true
    }));
    
    showToast('Maintenance mode enabled. Users will be notified.', 'success');
    setIsEdited(true);
    setShowMaintenanceModal(false);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and parameters</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowResetModal(true)}
            className="bg-white"
          >
            Reset to Defaults
          </Button>
          <Button 
            variant="primary" 
            onClick={saveSettings}
            disabled={!isEdited}
          >
            <Icon icon={saveIcon} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Points & Sessions */}
          <Card title="Points & WiFi Sessions" variant="primary">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="pointsPerMinute" className="block text-sm font-medium text-gray-700 mb-1">
                    Points Per Minute
                  </label>
                  <Input
                    id="pointsPerMinute"
                    name="pointsPerMinute"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.pointsPerMinute}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Points earned per minute of WiFi session
                  </p>
                </div>
                
                <div>
                  <label htmlFor="minSessionDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Session Duration (minutes)
                  </label>
                  <Input
                    id="minSessionDuration"
                    name="minSessionDuration"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.minSessionDuration}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum WiFi session duration to earn points
                  </p>
                </div>
                
                <div>
                  <label htmlFor="maxDailyPoints" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Daily Points
                  </label>
                  <Input
                    id="maxDailyPoints"
                    name="maxDailyPoints"
                    type="number"
                    min="100"
                    max="2000"
                    value={settings.maxDailyPoints}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum points a user can earn in a day
                  </p>
                </div>
                
                <div>
                  <label htmlFor="treeCostMultiplier" className="block text-sm font-medium text-gray-700 mb-1">
                    Tree Cost Multiplier
                  </label>
                  <Input
                    id="treeCostMultiplier"
                    name="treeCostMultiplier"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={settings.treeCostMultiplier}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Multiplier for tree points cost (higher = more expensive trees)
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* User Settings */}
          <Card title="User Settings" variant="secondary">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Allow Guest Accounts</h3>
                    <p className="text-sm text-gray-500">
                      Allow users to create temporary guest accounts
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="allowGuestAccounts"
                        checked={settings.allowGuestAccounts}
                        onChange={() => handleToggleChange('allowGuestAccounts')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Require Email Verification</h3>
                    <p className="text-sm text-gray-500">
                      Require users to verify their email address
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="requireEmailVerification"
                        checked={settings.requireEmailVerification}
                        onChange={() => handleToggleChange('requireEmailVerification')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-delete Inactive Trees</h3>
                    <p className="text-sm text-gray-500">
                      Automatically delete trees that haven't been watered
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="autoDeleteInactiveTrees"
                        checked={settings.autoDeleteInactiveTrees}
                        onChange={() => handleToggleChange('autoDeleteInactiveTrees')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="autoDeleteDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-delete After (days)
                  </label>
                  <Input
                    id="autoDeleteDays"
                    name="autoDeleteDays"
                    type="number"
                    min="30"
                    max="365"
                    value={settings.autoDeleteDays}
                    onChange={handleInputChange}
                    disabled={!settings.autoDeleteInactiveTrees}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days of inactivity before auto-deletion
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Notifications */}
          <Card title="Notifications" variant="tertiary">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="notificationFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    User Notification Frequency
                  </label>
                  <select
                    id="notificationFrequency"
                    name="notificationFrequency"
                    value={settings.notificationFrequency}
                    onChange={handleInputChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="instant">Instant</option>
                    <option value="hourly">Hourly Digest</option>
                    <option value="daily">Daily Digest</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    How often users receive push notifications
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Admin Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Send email alerts for system events to admins
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        name="adminEmailNotifications"
                        checked={settings.adminEmailNotifications}
                        onChange={() => handleToggleChange('adminEmailNotifications')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tertiary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* System Management */}
          <Card title="System Management" variant="accent">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="apiRateLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    API Rate Limit (requests/minute)
                  </label>
                  <Input
                    id="apiRateLimit"
                    name="apiRateLimit"
                    type="number"
                    min="50"
                    max="1000"
                    value={settings.apiRateLimit}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum API requests per minute per IP
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                    <p className="text-sm text-gray-500">
                      Put the system in maintenance mode (users will be logged out)
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant={settings.maintenanceMode ? 'primary' : 'outline'}
                      onClick={() => setShowMaintenanceModal(true)}
                      className={settings.maintenanceMode ? 'bg-red-600' : 'bg-white'}
                    >
                      {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Button variant="outline" className="bg-white w-full">
                    <Icon icon={databaseIcon} className="mr-2" />
                    Database Backup
                  </Button>
                </div>
                
                <div>
                  <Button variant="outline" className="bg-white w-full">
                    <Icon icon={cloudUploadIcon} className="mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Reset to Defaults Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Default Settings"
        variant="warning"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Icon icon={exclamationCircleIcon} className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Reset Settings</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowResetModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={resetToDefaults}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Reset to Defaults
          </Button>
        </div>
      </Modal>
      
      {/* Maintenance Mode Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Enable Maintenance Mode"
        variant="error"
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Icon icon={exclamationCircleIcon} className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Enable Maintenance Mode</h3>
          <p className="text-sm text-gray-500 mt-2">
            Enabling maintenance mode will log out all users and prevent new logins. Only administrators will be able to access the system. Are you sure you want to continue?
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowMaintenanceModal(false)}
            className="bg-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={enableMaintenanceMode}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Enable Maintenance Mode
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default SettingsPage; 