import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SafeScreen from '../../src/components/SafeScreen';

export default function ProfileScreen() {
  return (
    <SafeScreen backgroundColor="#f5f5f5">
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Profile management features coming soon...</Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 