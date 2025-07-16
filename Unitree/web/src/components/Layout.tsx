import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    { name: 'Trees', href: '/trees', icon: '🌳' },
    { name: 'Points', href: '/points', icon: '⭐' },
    { name: 'WiFi', href: '/wifi', icon: '📶' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl mr-2">🌱</span>
                <span className="text-xl font-bold text-green-600">Unitree</span>
              </Link>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.fullName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {user.points} pts
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      {user && (
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 