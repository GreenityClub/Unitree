import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Card } from '../../components';

export default function LeaderboardScreen() {
  // Placeholder data - replace with actual data from API
  const leaderboardData = [
    { id: 1, name: 'John Doe', points: 1200, rank: 1 },
    { id: 2, name: 'Jane Smith', points: 1100, rank: 2 },
    { id: 3, name: 'Bob Johnson', points: 1000, rank: 3 },
  ];

  const renderLeaderboardItem = (item: any, index: number) => (
    <View key={item.id} style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userPoints}>{item.points} points</Text>
      </View>
    </View>
  );

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top contributors this week</Text>
        </View>

        <Card style={styles.leaderboardCard}>
          {leaderboardData.map(renderLeaderboardItem)}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rankings update every 24 hours
          </Text>
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
  leaderboardCard: {
    margin: spacing.component.screenPadding,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userPoints: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.component.screenPadding,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
}); 