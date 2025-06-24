import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { isTablet } from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'disabled';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[size],
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const titleStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#4CAF50'} />
      ) : (
        <Text style={titleStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: isTablet() ? 400 : undefined, // Limit button width on tablets
    alignSelf: isTablet() ? 'center' : 'stretch', // Center buttons on tablets
  },
  // Sizes
  small: {
    paddingVertical: isTablet() ? 12 : 8,
    paddingHorizontal: isTablet() ? 24 : 16,
  },
  medium: {
    paddingVertical: isTablet() ? 20 : 15,
    paddingHorizontal: isTablet() ? 32 : 20,
  },
  large: {
    paddingVertical: isTablet() ? 24 : 18,
    paddingHorizontal: isTablet() ? 40 : 24,
  },
  // Variants
  primary: {
    backgroundColor: '#4CAF50',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  danger: {
    backgroundColor: '#f44336',
  },
  disabled: {
    backgroundColor: '#e0e0e0',
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: isTablet() ? 16 : 14,
  },
  mediumText: {
    fontSize: isTablet() ? 18 : 16,
  },
  largeText: {
    fontSize: isTablet() ? 20 : 18,
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: '#4CAF50',
  },
  dangerText: {
    color: 'white',
  },
  disabledText: {
    color: '#999',
  },
});

export default Button;