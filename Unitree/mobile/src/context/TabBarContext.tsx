import React, { createContext, useContext, ReactNode } from 'react';
import { useTabBarVisibility } from '../hooks/useTabBarVisibility';

interface TabBarContextType {
  isVisible: any; // SharedValue from reanimated
  handleScroll: (event: any) => void;
  handleScrollBeginDrag: () => void;
  handleScrollEndDrag: () => void;
  handleTouchStart: () => void;
  showTabBar: () => void;
  hideTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

interface TabBarProviderProps {
  children: ReactNode;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children }) => {
  const tabBarVisibility = useTabBarVisibility();

  return (
    <TabBarContext.Provider value={tabBarVisibility}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBarContext = () => {
  const context = useContext(TabBarContext);
  if (context === undefined) {
    throw new Error('useTabBarContext must be used within a TabBarProvider');
  }
  return context;
}; 