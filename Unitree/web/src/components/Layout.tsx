import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { useAdminAuth } from '../contexts/AdminAuthContext';
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
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'superadmin';
  
  const [collapsed, setCollapsed] = useState(() => {
    // Đọc trạng thái từ localStorage khi component được mount
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lưu trạng thái collapsed vào localStorage khi nó thay đổi
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Check if menu item is active
  const isActive = (path: string) => {
    return location.pathname === path;
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

  return (
    <div className="min-h-screen flex bg-tertiary-light">
      {/* Fixed-width sidebar with overflow hidden */}
              <div 
        className={`bg-white shadow transition-all duration-300 ease-in-out ${expanded ? 'w-64' : 'w-16'} overflow-x-hidden fixed left-0 top-0 z-10`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ height: '100vh' }}
      >
        {/* Logo section */}
        <div className="h-16 relative">
          {/* Logo always centered in collapsed mode */}
          <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center">
            <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center">
              <Icon icon={leafIcon} className="text-white" />
            </div>
          </div>
          
          {/* Title - separate from logo */}
          <div className={`absolute top-0 left-16 h-16 flex items-center transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-xl font-bold text-primary-dark whitespace-nowrap">
              Unitree Admin
            </h2>
          </div>
        </div>

        <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden">
          {/* Main navigation */}
          <nav className="py-4">
            <ul className="space-y-1">
              {/* Dashboard */}
              <li>
                <NavLink 
                  to="/admin/dashboard" 
                  className={({ isActive }) => 
                    `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                  }
                >
                  {/* Active indicator */}
                  {isActive('/admin/dashboard') && (
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                  )}
                  
                  {/* Icon column - always visible and fixed width */}
                  <div className="w-16 flex items-center justify-center flex-shrink-0">
                                          <Icon 
                      icon={dashboardIcon} 
                      className={`transition-all duration-300 ${isActive('/admin/dashboard') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                    />
                  </div>
                  
                  {/* Text column - can expand/collapse */}
                  <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                                          <span className={`transition-all duration-300 ${isActive('/admin/dashboard') ? 'font-bold text-primary transform scale-125' : 'text-text group-hover:text-primary group-hover:scale-110'}`}>
                      Dashboard
                    </span>
                  </div>
                </NavLink>
              </li>
              
              {/* Admins - only visible to superadmin */}
              {isSuperAdmin && (
                <li>
                  <NavLink 
                    to="/admin/admins" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/admins') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                                            <Icon 
                        icon={userIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/admins') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-300 ${isActive('/admin/admins') ? 'font-bold text-primary transform scale-125' : 'text-text group-hover:text-primary group-hover:scale-110'}`}>
                        Admins
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Students */}
              {admin?.permissions?.manageStudents && (
                <li>
                  <NavLink 
                    to="/admin/students" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/students') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                                          <Icon 
                      icon={usersIcon} 
                      className={`transition-all duration-300 ${isActive('/admin/students') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                    />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-300 ${isActive('/admin/students') ? 'font-bold text-primary transform scale-125' : 'text-text group-hover:text-primary group-hover:scale-110'}`}>
                        Students
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Trees */}
              {admin?.permissions?.manageTrees && (
                <li>
                  <NavLink 
                    to="/admin/trees" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/trees') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={treeIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/trees') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/trees') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Trees
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Tree Types */}
              {admin?.permissions?.manageTreeTypes && (
                <li>
                  <NavLink 
                    to="/admin/tree-types" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/tree-types') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={leafIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/tree-types') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/tree-types') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Tree Types
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Real Trees */}
              {admin?.permissions?.manageRealTrees && (
                <li>
                  <NavLink 
                    to="/admin/real-trees" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/real-trees') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={treeIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/real-trees') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/real-trees') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Real Trees
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Points */}
              {admin?.permissions?.managePoints && (
                <li>
                  <NavLink 
                    to="/admin/points" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/points') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={medalIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/points') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/points') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Points
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* WiFi Sessions */}
              {admin?.permissions?.manageWifiSessions && (
                <li>
                  <NavLink 
                    to="/admin/wifi" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/wifi') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={wifiIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/wifi') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/wifi') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        WiFi Sessions
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
              
              {/* Statistics */}
              {admin?.permissions?.viewStatistics && (
                <li>
                  <NavLink 
                    to="/admin/statistics" 
                    className={({ isActive }) => 
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/statistics') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={chartIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/statistics') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/statistics') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Statistics
                      </span>
                    </div>
                  </NavLink>
                </li>
              )}
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
                      `h-12 flex items-center relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group ${isActive ? 'nav-active scale-105' : ''}`
                    }
                  >
                    {isActive('/admin/settings') && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-md shadow-md z-10"></span>
                    )}
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={settingsIcon} 
                        className={`transition-all duration-300 ${isActive('/admin/settings') ? 'text-primary transform scale-170 font-bold' : 'text-gray-500 group-hover:text-primary group-hover:scale-130'}`}
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className={`transition-all duration-200 ${isActive('/admin/settings') ? 'font-medium text-primary transform scale-105' : 'text-text group-hover:text-primary group-hover:scale-105'}`}>
                        Settings
                      </span>
                    </div>
                  </NavLink>
                </li>
                
                {/* Logout */}
                <li>
                  <button 
                    onClick={handleLogout}
                    className="h-12 flex items-center w-full relative transition-all duration-300 hover:scale-110 hover:bg-primary/10 group"
                  >
                    <div className="w-16 flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={logoutIcon} 
                        className="text-red-600 group-hover:text-red-700 group-hover:scale-130 transition-all duration-300"
                      />
                    </div>
                    <div className={`transition-all duration-300 whitespace-nowrap ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                      <span className="text-red-600 group-hover:text-red-700 group-hover:scale-105 transition-all duration-200">
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
                          <Icon 
              icon={listUlIcon} 
              className="text-gray-500 hover:text-primary hover:scale-130 transition-all duration-300" 
            />
          </button>
        </div>
      </div>
      
      {/* Main content with margin to account for sidebar */}
      <div className={`flex-1 p-8 transition-all duration-300 ${expanded ? 'ml-64' : 'ml-16'} `}>
        {children}
      </div>
    </div>
  );
}; 