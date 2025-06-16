import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';

export default function AchievementsScreen() {
  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>Track your progress and milestones</Text>
        </View>
        
        {/* Achievement content will go here */}
        <View style={styles.content}>
          <Text style={styles.placeholder}>Achievements content coming soon...</Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.component.screenPadding,
    paddingTop: spacing.component.screenPaddingVertical,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.component.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 