import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import { eyeIcon, eyeSlashIcon, treeIcon } from '../../utils/icons';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      // Try to login with API
      await login({ username, password });
      
      showToast('Login successful! Redirecting to dashboard...', 'success');
      
      // Add a slight delay to allow toast to show before navigation
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
      
    } catch (err: any) {
      // Show error via toast only
      const errorMsg = err.message || 'Login failed';
      showToast(errorMsg, 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    if (name === 'password') setPassword(value);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background with forest scene */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/5bb58eb6-0c32-4eb3-ae76-83e0dcd29eab.png')`,
          filter: 'brightness(0.85)'
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-amber-800/20" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg p-6 shadow-xl flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
            <span className="text-gray-700 font-medium">Signing in...</span>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 ">
        <Card 
          className="backdrop-blur-sm bg-white/95 border-green-800/20 shadow-2xl"
          rounded="4xl"
        >
          <div className="p-0">
            <div className="text-center space-y-0">
              {/* Sprout to Forest Logo */}
              <div className="relative z-10 flex justify-center mb-0">
                <img
                  src="/assets/b61064bb-226b-4edc-937c-612625337883.png"
                  alt="Sprout to Forest"
                  className="h-36 object-contain opacity-90"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-0 p-6">
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Username
                </label>
                <Input
                  type="text"
                  name="username"
                  value={username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="bg-white/80 border-green-700/30 focus:border-green-700 focus:ring-green-700/20 rounded-lg"
                  required
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="bg-white/80 border-green-700/30 focus:border-green-700 focus:ring-green-700/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon icon={showPassword ? eyeSlashIcon : eyeIcon} />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-green-700 hover:bg-green-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default AdminLoginPage; 