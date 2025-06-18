import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ 
  children, 
  style,
  backgroundColor = colors.background
}) => {
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
      <View style={[styles.container, style]}>
        {children}
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
}); 