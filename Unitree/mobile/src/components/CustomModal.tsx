import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { rs, rf } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: 'primary' | 'destructive';
}

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  iconName?: string;
  iconColor?: string;
  buttons?: ButtonProps[];
  type?: 'success' | 'warning' | 'error' | 'default';
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  iconName = 'alert-circle-outline',
  iconColor = '#50AF27',
  buttons = [],
  type = 'default',
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { 
        damping: 15,
        stiffness: 150,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconColor: '#50AF27',
          iconName: 'check-circle-outline',
          borderColor: '#50AF27',
        };
      case 'warning':
        return {
          iconColor: '#FFA000',
          iconName: 'alert-outline',
          borderColor: '#FFA000',
        };
      case 'error':
        return {
          iconColor: '#D32F2F',
          iconName: 'close-circle-outline',
          borderColor: '#D32F2F',
        };
      default:
        return {
          iconColor: iconColor,
          iconName: iconName,
          borderColor: '#50AF27',
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
          <View style={styles.modal}>
            {/* Header with Icon */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${typeStyles.iconColor}15` }]}>
                <Icon
                  name={typeStyles.iconName}
                  size={40}
                  color={typeStyles.iconColor}
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'primary' && styles.primaryButton,
                    index !== buttons.length - 1 && styles.buttonMargin,
                  ]}
                  onPress={button.onPress}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                      button.style === 'primary' && styles.primaryButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(20),
    backgroundColor: 'transparent',
  },
  modalContainer: {
    width: '100%',
    maxWidth: rs(320),
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: rs(16),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  header: {
    alignItems: 'center',
    paddingTop: rs(24),
    paddingHorizontal: rs(24),
  },
  iconContainer: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rs(16),
  },
  content: {
    paddingHorizontal: rs(24),
    paddingBottom: rs(24),
    alignItems: 'center',
  },
  title: {
    fontSize: rf(20),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: rs(8),
  },
  message: {
    fontSize: rf(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: rf(22),
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: rs(24),
    paddingTop: 0,
    gap: rs(12),
  },
  button: {
    flex: 1,
    paddingVertical: rs(14),
    paddingHorizontal: rs(20),
    borderRadius: rs(12),
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rs(48),
  },
  primaryButton: {
    backgroundColor: '#50AF27',
  },
  destructiveButton: {
    backgroundColor: '#FFA79D',
  },
  buttonMargin: {
    marginRight: rs(8),
  },
  buttonText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#333',
  },
  primaryButtonText: {
    color: '#fff',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});

export default CustomModal; 