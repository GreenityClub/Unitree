import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import SafeScreen from '../../components/SafeScreen';
import { colors, spacing } from '../../theme';
import { Card, IconSymbol } from '../../components';

interface TreeDetails {
  id: string;
  name: string;
  species: string;
  plantedDate: string;
  location: string;
  height: number;
  health: number;
  co2Absorbed: number;
  imageUrl: string;
}

const mockTreeDetails: TreeDetails = {
  id: '1',
  name: 'Oak Pioneer',
  species: 'Quercus robur',
  plantedDate: '2024-01-15',
  location: 'North Forest Area',
  height: 2.5,
  health: 95,
  co2Absorbed: 12.5,
  imageUrl: 'https://example.com/tree-image.jpg', // Replace with actual image URL
};

export default function TreeDetailScreen() {
  const { id } = useLocalSearchParams();

  // In a real app, fetch tree details based on id
  const tree = mockTreeDetails;

  const renderMetricCard = (icon: string, value: string | number, label: string) => (
    <Card style={styles.metricCard}>
      <IconSymbol name={icon} size={24} color={colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );

  return (
    <SafeScreen backgroundColor={colors.background}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{tree.name}</Text>
          <Text style={styles.subtitle}>{tree.species}</Text>
        </View>

        <Card style={styles.imageCard}>
          <Image
            source={{ uri: tree.imageUrl }}
            style={styles.treeImage}
            resizeMode="cover"
          />
        </Card>

        <View style={styles.metricsContainer}>
          {renderMetricCard('ruler', `${tree.height}m`, 'Height')}
          {renderMetricCard('heart', `${tree.health}%`, 'Health')}
          {renderMetricCard('cloud', `${tree.co2Absorbed}kg`, 'CO₂ Absorbed')}
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Planted Date</Text>
              <Text style={styles.detailValue}>{tree.plantedDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{tree.location}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Growth Milestone</Text>
              <Text style={styles.timelineDate}>March 15, 2024</Text>
              <Text style={styles.timelineDescription}>
                Tree reached 2.5m in height
              </Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Health Check</Text>
              <Text style={styles.timelineDate}>March 1, 2024</Text>
              <Text style={styles.timelineDescription}>
                Tree health assessment completed: 95% healthy
              </Text>
            </View>
          </View>
        </Card>
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
    fontSize: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  imageCard: {
    margin: spacing.component.screenPadding,
    padding: 0,
    overflow: 'hidden',
  },
  treeImage: {
    width: '100%',
    height: 200,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.component.screenPadding,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: spacing.component.xs,
    padding: spacing.component.md,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: spacing.component.sm,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailsCard: {
    margin: spacing.component.screenPadding,
    padding: spacing.component.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  activityCard: {
    margin: spacing.component.screenPadding,
    padding: spacing.component.md,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.component.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.component.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.component.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: colors.textPrimary,
  },
}); 