import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { isTablet } from '../../utils/responsive';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 20,
}) => {
  const cardPadding = isTablet() ? Math.max(padding * 1.5, 24) : padding;
  
  return (
    <View style={[styles.card, { padding: cardPadding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: isTablet() ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: isTablet() ? 4 : 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: isTablet() ? 6 : 3.84,
    elevation: isTablet() ? 8 : 5,
    marginBottom: isTablet() ? 20 : 15,
    marginHorizontal: isTablet() ? 10 : 0,
  },
});

export default Card;