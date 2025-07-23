import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import {
  dashboardIcon,
  usersIcon,
  treeIcon,
  leafIcon,
  wifiIcon,
  medalIcon,
  settingsIcon,
  chartIcon,
  logoutIcon,
  arrowLeftIcon,
  arrowRightIcon,
  listUlIcon,
  userIcon
} from '../utils/icons';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-tertiary-light">
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
  const [collapsed, setCollapsed] = useState(() => {
    // Đọc trạng thái từ localStorage khi component được mount
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const navigate = useNavigate();
  
  // Update current path when component mounts or URL changes
  useEffect(() => {
    setCurrentPath(window.location.pathname);
    
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Lưu trạng thái collapsed vào localStorage khi nó thay đổi
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Check if menu item is active
  const isActive = (path: string) => {
    return currentPath === path;
  };

  const expanded = !collapsed || isHovered;

  // Hàm toggle sidebar
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Hàm logout
  const handleLogout = () => {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  // Khoảng cách cố định giữa sidebar và nội dung
  const fixedGap = 'pl-16 pr-16 pt-8 pb-16'; // padding-left: 4rem (64px), padding-right: 4rem (64px)

  return (
    <div className="min-h-screen flex bg-tertiary-light">
      {/* Sidebar */}
      <div 
        className={`bg-white shadow h-screen sticky top-0 left-0 transition-all duration-300 ease-in-out ${expanded ? 'w-64' : 'w-16'} overflow-hidden`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo section */}
        <div className="h-16 border-b border-primary relative">
          {/* Logo always centered in collapsed mode */}
          <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center">
            <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center">
              <Icon icon={leafIcon} className="text-white" />
            </div>
          </div>
          
          {/* Title - separate from logo */}
          <div className={`absolute top-0 left-16 h-16 flex items-center transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-xl font-semibold text-primary-dark whitespace-nowrap">
              Unitree Admin
            </h2>
          </div>
        </div>

        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          {/* Main navigation */}
          <nav className="py-4">
            <ul className="space-y-1">
              {/* Dashboard */}
              <li>
                <NavLink 
                  to="/admin/dashboard" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      
                      {/* Icon column - always visible and fixed width */}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={dashboardIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      
                      {/* Text column - can expand/collapse */}
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Dashboard
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Admins */}
              <li>
                <NavLink 
                  to="/admin/admins" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={userIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Admins
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Students */}
              <li>
                <NavLink 
                  to="/admin/students" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={usersIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Students
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Trees */}
              <li>
                <NavLink 
                  to="/admin/trees" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={treeIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Trees
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Tree Types */}
              <li>
                <NavLink 
                  to="/admin/tree-types" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={leafIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Tree Types
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Real Trees */}
              <li>
                <NavLink 
                  to="/admin/real-trees" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={treeIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Real Trees
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Points */}
              <li>
                <NavLink 
                  to="/admin/points" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={medalIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Points
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* WiFi Sessions */}
              <li>
                <NavLink 
                  to="/admin/wifi" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={wifiIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          WiFi Sessions
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
              
              {/* Statistics */}
              <li>
                <NavLink 
                  to="/admin/statistics" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                      )}
                      <div className="w-16 flex items-center justify-center flex-shrink-0">
                        <Icon 
                          icon={chartIcon} 
                          className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                        />
                      </div>
                      <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                          Statistics
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
            
            {/* Settings section */}
            <div className="pt-8 mt-4 border-t border-gray-200">
              <div className={`h-8 pl-16 mb-2 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Settings
                </h3>
              </div>
              
              <ul className="space-y-1">
                {/* Settings */}
                <li>
                  <NavLink 
                    to="/admin/settings" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative hover: transition-colors group ${isActive ? 'text-primary' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
                        )}
                        <div className="w-16 flex items-center justify-center flex-shrink-0">
                          <Icon 
                            icon={settingsIcon} 
                            className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`}
                          />
                        </div>
                        <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                          <span className={`transition-colors ${isActive ? 'font-medium text-primary' : 'text-text group-hover:text-primary'}`}>
                            Settings
                          </span>
                        </div>
                      </>
                    )}
                  </NavLink>
                </li>
                
                {/* Logout */}
                <li>
                  <button 
                    onClick={handleLogout}
                    className="h-12 flex items-center w-full relative hover: transition-colors group"
                  >
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={logoutIcon} 
                        className="text-red-600 group-hover:text-red-700 transition-colors"
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className="text-red-600 group-hover:text-red-700 transition-colors">
                        Logout
                      </span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        
        {/* Collapse toggle button */}
        <div className="absolute bottom-4 w-16 flex justify-center z-10">
          <button
            onClick={toggleSidebar}
            className="bg-white h-8 w-8 transition-all"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon icon={listUlIcon} className="text text" />
          </button>
        </div>
      </div>
      
      {/* Main content với khoảng cách cố định từ sidebar */}
      <div className={`flex-1 transition-all duration-300 ${fixedGap}`}>
        {children}
      </div>
    </div>
  );
}; 