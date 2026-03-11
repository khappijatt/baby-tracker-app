import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  gender?: string;
  photoUrl?: string;
}

interface DashboardData {
  todayFeeding: any[];
  todayDiaper: any[];
  todaySleep: any[];
  todayMedicine: any[];
  upcomingAppointments: any[];
  upcomingVaccinations: any[];
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) return 'Newborn';
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years} year${years > 1 ? 's' : ''}`;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGenderColor(gender?: string) {
  if (gender === 'male') return ['#4A90D9', '#667EEA'] as const;
  if (gender === 'female') return ['#FF6B9D', '#F093FB'] as const;
  return ['#4ECDC4', '#667EEA'] as const;
}

export default function DashboardScreen() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { user, logOut, isFirebaseConfigured } = useAuth();

  const { data: children = [], isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const {
    data: dashboardData,
    isLoading: loadingDashboard,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: [`/api/children/${selectedChildId}/dashboard`],
    enabled: !!selectedChildId,
  });

  const selectedChild = children.find(c => c.id === selectedChildId);

  if (loadingChildren) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <LinearGradient colors={['#FF6B9D', '#667EEA']} style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Welcome!</Text>
          <Text style={styles.emptyText}>
            Add your first child to start tracking their growth and milestones.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-child' as any)}>
            <Text style={styles.emptyButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const QUICK = [
    { icon: 'nutrition', label: 'Feed', color: Colors.primary, bg: Colors.primaryLight, tab: '/(tabs)/tracking' },
    { icon: 'water', label: 'Diaper', color: Colors.teal, bg: Colors.tealLight, tab: '/(tabs)/tracking' },
    { icon: 'moon', label: 'Sleep', color: Colors.purple, bg: Colors.purpleLight, tab: '/(tabs)/tracking' },
    { icon: 'medkit', label: 'Medicine', color: Colors.coral, bg: Colors.coralLight, tab: '/(tabs)/tracking' },
  ];

  const SUMMARY = [
    { icon: 'nutrition', count: dashboardData?.todayFeeding.length ?? 0, label: 'Feedings', color: Colors.primary, bg: Colors.primaryLight },
    { icon: 'water', count: dashboardData?.todayDiaper.length ?? 0, label: 'Diapers', color: Colors.teal, bg: Colors.tealLight },
    { icon: 'moon', count: dashboardData?.todaySleep.length ?? 0, label: 'Naps', color: Colors.purple, bg: Colors.purpleLight },
    { icon: 'medkit', count: dashboardData?.todayMedicine.length ?? 0, label: 'Meds', color: Colors.coral, bg: Colors.coralLight },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loadingDashboard} onRefresh={refetch} tintColor={Colors.white} />}
    >
      <LinearGradient colors={['#FF6B9D', '#E8547A', '#667EEA']} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            {selectedChild && (
              <Text style={styles.childNameHeader}>{selectedChild.name}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {selectedChild && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => router.push(`/edit-child?id=${selectedChild.id}` as any)}
              >
                <Ionicons name="pencil" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/add-child' as any)}
            >
              <Ionicons name="person-add" size={18} color={Colors.white} />
            </TouchableOpacity>
            {isFirebaseConfigured && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => user ? logOut() : router.push('/auth' as any)}
              >
                <Ionicons name={user ? 'person-circle' : 'log-in-outline'} size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {selectedChild && (
          <View style={styles.childCard}>
            <LinearGradient
              colors={getGenderColor(selectedChild.gender)}
              style={styles.childAvatar}
            >
              <Text style={styles.childAvatarText}>{getInitials(selectedChild.name)}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.childCardName}>{selectedChild.name}</Text>
              <Text style={styles.childCardAge}>{calculateAge(selectedChild.dateOfBirth)}</Text>
            </View>
            <TouchableOpacity
              style={styles.healthBtn}
              onPress={() => router.push('/(tabs)/health' as any)}
            >
              <Ionicons name="medical" size={14} color={Colors.primary} />
              <Text style={styles.healthBtnText}>Health</Text>
            </TouchableOpacity>
          </View>
        )}

        {children.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
          >
            {children.map(child => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childPill, selectedChildId === child.id && styles.childPillActive]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={[styles.childPillText, selectedChildId === child.id && styles.childPillTextActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Quick Log</Text>
        <View style={styles.quickGrid}>
          {QUICK.map(q => (
            <TouchableOpacity
              key={q.label}
              style={[styles.quickCard, { backgroundColor: q.bg }]}
              onPress={() => router.push(q.tab as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: q.color + '25' }]}>
                <Ionicons name={q.icon as any} size={26} color={q.color} />
              </View>
              <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Today</Text>
        <View style={styles.summaryRow}>
          {SUMMARY.map(s => (
            <View key={s.label} style={[styles.summaryCard, { borderLeftColor: s.color }]}>
              <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {(dashboardData?.upcomingAppointments?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/health' as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {dashboardData!.upcomingAppointments.slice(0, 2).map(apt => (
              <View key={apt.id} style={styles.aptCard}>
                <View style={[styles.aptDot, { backgroundColor: Colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.aptType}>{apt.appointmentType || 'Appointment'}</Text>
                  {apt.doctorName ? <Text style={styles.aptDoctor}>{apt.doctorName}</Text> : null}
                  <Text style={styles.aptDate}>{formatDateTime(apt.appointmentDate)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              </View>
            ))}
          </>
        )}

        {(dashboardData?.upcomingVaccinations?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Vaccinations Due</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/health' as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {dashboardData!.upcomingVaccinations.slice(0, 2).map(v => (
              <View key={v.id} style={styles.vaccCard}>
                <View style={[styles.vaccIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vaccName}>{v.vaccineName}</Text>
                  {v.scheduledAge ? <Text style={styles.vaccAge}>{v.scheduledAge}</Text> : null}
                  {v.dueDate ? <Text style={styles.vaccDate}>Due: {formatDate(v.dueDate)}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 28, padding: 36, alignItems: 'center', width: '100%' },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyButton: { backgroundColor: Colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 16 },
  emptyButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  headerGradient: { paddingTop: Platform.OS === 'web' ? 67 : 56, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 20 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  childNameHeader: { fontSize: 24, fontWeight: '800', color: Colors.white, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  childCard: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  childAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 20, fontWeight: '800', color: Colors.white },
  childCardName: { fontSize: 17, fontWeight: '700', color: Colors.white },
  childCardAge: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  healthBtn: { backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', gap: 5, alignItems: 'center' },
  healthBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  childPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  childPillActive: { backgroundColor: Colors.white },
  childPillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  childPillTextActive: { color: Colors.primary },

  body: { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  quickCard: { width: (width - 52) / 4, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderLeftWidth: 3, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  summaryCount: { fontSize: 26, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 3, fontWeight: '600' },

  aptCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  aptDot: { width: 10, height: 10, borderRadius: 5 },
  aptType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  aptDoctor: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  aptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },

  vaccCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  vaccIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  vaccName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vaccAge: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  vaccDate: { fontSize: 12, color: Colors.warning, marginTop: 3, fontWeight: '600' },
});
