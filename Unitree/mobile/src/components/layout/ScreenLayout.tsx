import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { 
  isTablet, 
  isTabletLarge, 
  getMaxContentWidth, 
  getContainerPadding, 
  getLayoutConfig 
} from '../../utils/responsive';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  enableScrollOnTablet?: boolean;
  centered?: boolean;
  fullWidth?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ 
  children, 
  style,
  backgroundColor = colors.background,
  enableScrollOnTablet = false,
  centered = true,
  fullWidth = false
}) => {
  const layoutConfig = getLayoutConfig();
  
  const renderContent = () => {
    if (layoutConfig.isTablet && !fullWidth) {
      const content = (
        <View style={[
          styles.tabletContentWrapper,
          { 
            maxWidth: layoutConfig.maxContentWidth,
            paddingHorizontal: layoutConfig.containerPadding
          }
        ]}>
          {children}
        </View>
      );

      if (enableScrollOnTablet) {
        return (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { alignItems: centered ? 'center' : 'stretch' }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        );
      }

      return content;
    }
    
    return children;
  };

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor }]} 
      edges={['left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[
        styles.container, 
        style,
        {
          alignItems: layoutConfig.isTablet && centered && !fullWidth ? 'center' : 'stretch',
          paddingHorizontal: layoutConfig.isTablet && fullWidth ? layoutConfig.containerPadding : 0
        }
      ]}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  tabletContentWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
}); 