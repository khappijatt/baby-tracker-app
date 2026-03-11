import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const AGE_RANGES = [
  { value: '0-12mo', label: '0-12 Months' },
  { value: '1-2yr', label: '1-2 Years' },
  { value: '2-3yr', label: '2-3 Years' },
  { value: '3-4yr', label: '3-4 Years' },
  { value: '4-5yr', label: '4-5 Years' },
];

const CATEGORIES = [
  { value: 'physical', label: 'Physical', icon: 'fitness', color: Colors.primary, bg: Colors.primaryLight },
  { value: 'cognitive', label: 'Cognitive', icon: 'bulb', color: Colors.purple, bg: Colors.purpleLight },
  { value: 'social', label: 'Social', icon: 'people', color: Colors.teal, bg: Colors.tealLight },
  { value: 'language', label: 'Language', icon: 'chatbubbles', color: Colors.coral, bg: Colors.coralLight },
];

export default function MilestonesScreen() {
  const [selectedAgeRange, setSelectedAgeRange] = useState('0-12mo');

  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });

  const selectedChild = children[0];
  const { data: milestones = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${selectedChild?.id}/milestones`],
    enabled: !!selectedChild,
  });

  const filteredMilestones = milestones.filter((m: any) => m.ageRange === selectedAgeRange);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F093FB', '#FF6B9D']} style={styles.header}>
        <Text style={styles.headerTitle}>Milestones</Text>
        <Text style={styles.headerSubtitle}>Track developmental progress</Text>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.ageSelector}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 8 }}
      >
        {AGE_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[styles.ageChip, selectedAgeRange === range.value && styles.ageChipActive]}
            onPress={() => setSelectedAgeRange(range.value)}
          >
            <Text style={[styles.ageChipText, selectedAgeRange === range.value && styles.ageChipTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statsContainer}>
        {CATEGORIES.map((category) => {
          const catMilestones = filteredMilestones.filter((m: any) => m.category === category.value);
          const achieved = catMilestones.filter((m: any) => m.achieved).length;
          const total = catMilestones.length;
          const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;
          return (
            <View key={category.value} style={styles.statCard}>
              <Ionicons name={category.icon as any} size={22} color={category.color} />
              <Text style={styles.statLabel}>{category.label}</Text>
              <Text style={styles.statValue}>{achieved}/{total}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: category.color }]} />
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.milestonesList}>
        {filteredMilestones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color={Colors.lightGray} />
            <Text style={styles.emptyText}>
              {children.length === 0 ? 'Add a child first' : 'No milestones for this age range yet'}
            </Text>
          </View>
        ) : (
          CATEGORIES.map((category) => {
            const catMilestones = filteredMilestones.filter((m: any) => m.category === category.value);
            if (catMilestones.length === 0) return null;
            return (
              <View key={category.value} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={category.icon as any} size={18} color={category.color} />
                  <Text style={[styles.categoryTitle, { color: category.color }]}>{category.label}</Text>
                </View>
                {catMilestones.map((milestone: any) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function MilestoneCard({ milestone }: { milestone: any }) {
  return (
    <View style={styles.milestoneCard}>
      <View style={styles.milestoneCheckbox}>
        {milestone.achieved ? (
          <Ionicons name="checkmark-circle" size={30} color={Colors.success} />
        ) : (
          <Ionicons name="ellipse-outline" size={30} color={Colors.lightGray} />
        )}
      </View>
      <View style={styles.milestoneContent}>
        <Text style={[styles.milestoneTitle, milestone.achieved && styles.milestoneAchieved]}>
          {milestone.title}
        </Text>
        {milestone.description && (
          <Text style={styles.milestoneDescription}>{milestone.description}</Text>
        )}
        {milestone.achieved && milestone.achievedDate && (
          <View style={styles.achievedBadge}>
            <Ionicons name="calendar" size={13} color={Colors.success} />
            <Text style={styles.achievedDate}>Achieved {formatDate(milestone.achievedDate)}</Text>
          </View>
        )}
        {milestone.notes && <Text style={styles.milestoneNotes}>{milestone.notes}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: Platform.OS === 'web' ? 67 : 56, paddingHorizontal: 22, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  ageSelector: { backgroundColor: Colors.white, paddingVertical: 12 },
  ageChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.lightGray },
  ageChipActive: { backgroundColor: Colors.primary },
  ageChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  ageChipTextActive: { color: Colors.white },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: { width: '47%', backgroundColor: Colors.white, borderRadius: 18, padding: 14, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  progressBar: { width: '100%', height: 5, backgroundColor: Colors.lightGray, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  milestonesList: { flex: 1, padding: 15 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 20, textAlign: 'center' },
  categorySection: { marginBottom: 24 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  categoryTitle: { fontSize: 16, fontWeight: '800' },
  milestoneCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  milestoneCheckbox: { marginRight: 12 },
  milestoneContent: { flex: 1 },
  milestoneTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  milestoneAchieved: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  milestoneDescription: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },
  achievedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.successLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  achievedDate: { fontSize: 12, color: Colors.success, marginLeft: 4, fontWeight: '700' },
  milestoneNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
});
