import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/query-client';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'nutrition', label: 'Nutrition', icon: 'nutrition' },
  { value: 'development', label: 'Development', icon: 'trending-up' },
  { value: 'health', label: 'Health', icon: 'medical' },
  { value: 'sleep', label: 'Sleep', icon: 'moon' },
  { value: 'safety', label: 'Safety', icon: 'shield-checkmark' },
  { value: 'behavior', label: 'Behavior', icon: 'happy' },
  { value: 'social', label: 'Social', icon: 'people' },
];

const AGE_FILTERS = [
  { value: 'all', label: 'All Ages' },
  { value: '0-12mo', label: '0-12 Months' },
  { value: '1-2yr', label: '1-2 Years' },
  { value: '2-3yr', label: '2-3 Years' },
  { value: '3-4yr', label: '3-4 Years' },
  { value: '4-5yr', label: '4-5 Years' },
];

export default function ResourcesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: ['/api/resources', selectedCategory, selectedAge],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedAge !== 'all') params.append('ageRange', selectedAge);
      const url = new URL(`/api/resources?${params.toString()}`, getApiUrl());
      const response = await fetch(url.toString());
      return response.json();
    },
  });

  const getCategoryIcon = (category: string) =>
    CATEGORIES.find((c) => c.value === category)?.icon || 'book';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resources</Text>
        <Text style={styles.headerSubtitle}>Educational content & guides</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.ageFilter}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 8, paddingVertical: 10 }}
      >
        {AGE_FILTERS.map((age) => (
          <TouchableOpacity
            key={age.value}
            style={[styles.ageChip, selectedAge === age.value && styles.ageChipActive]}
            onPress={() => setSelectedAge(age.value)}
          >
            <Text style={[styles.ageChipText, selectedAge === age.value && styles.ageChipTextActive]}>
              {age.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={{ paddingHorizontal: 15, gap: 8, paddingVertical: 10 }}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[styles.categoryTab, selectedCategory === category.value && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Ionicons
              name={category.icon as any}
              size={18}
              color={selectedCategory === category.value ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.categoryTabText, selectedCategory === category.value && styles.categoryTabTextActive]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.resourcesList}>
        {resources.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={Colors.lightGray} />
            <Text style={styles.emptyText}>No resources found</Text>
          </View>
        ) : (
          resources.map((resource: any) => (
            <ResourceCard key={resource.id} resource={resource} icon={getCategoryIcon(resource.category)} />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function ResourceCard({ resource, icon }: { resource: any; icon: string }) {
  const openLink = () => {
    if (resource.externalUrl) {
      Linking.openURL(resource.externalUrl);
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return Colors.primary;
      case 'tips': return '#4FC3F7';
      case 'article': return '#9F7AEA';
      default: return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={styles.resourceCard} onPress={openLink} disabled={!resource.externalUrl}>
      <View style={styles.resourceIcon}>
        <Ionicons name={icon as any} size={24} color={Colors.primary} />
      </View>
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <Text style={styles.resourceTitle}>{resource.title}</Text>
          {resource.contentType && (
            <View style={[styles.contentTypeBadge, { backgroundColor: getContentTypeColor(resource.contentType) + '20' }]}>
              <Text style={[styles.contentTypeText, { color: getContentTypeColor(resource.contentType) }]}>
                {resource.contentType}
              </Text>
            </View>
          )}
        </View>
        {resource.content && (
          <Text style={styles.resourceDescription} numberOfLines={3}>{resource.content}</Text>
        )}
        <View style={styles.resourceMeta}>
          <View style={styles.metaTag}>
            <Ionicons name="pricetag" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{resource.category}</Text>
          </View>
          <View style={styles.metaTag}>
            <Ionicons name="time" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{resource.ageRange === 'all' ? 'All ages' : resource.ageRange}</Text>
          </View>
          {resource.externalUrl && (
            <View style={styles.metaTag}>
              <Ionicons name="link" size={13} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary }]}>Learn more</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  ageFilter: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  ageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.lightGray },
  ageChipActive: { backgroundColor: Colors.primary },
  ageChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  ageChipTextActive: { color: Colors.white },
  categoryTabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  categoryTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.veryLightGray },
  categoryTabActive: { backgroundColor: Colors.primary + '20' },
  categoryTabText: { marginLeft: 5, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  categoryTabTextActive: { color: Colors.primary },
  resourcesList: { flex: 1, padding: 15 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 20 },
  resourceCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  resourceIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resourceContent: { flex: 1 },
  resourceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  resourceTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  contentTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  contentTypeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  resourceDescription: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  resourceMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaTag: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4, textTransform: 'capitalize' },
});
