import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';

function DatePickerModal({
  visible, date, onConfirm, onCancel,
}: {
  visible: boolean; date: Date; onConfirm: (d: Date) => void; onCancel: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    if (d > new Date()) { Alert.alert('Invalid date', 'Date of birth cannot be in the future.'); return; }
    onConfirm(d);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.container}>
          <Text style={pickerStyles.title}>Select Date of Birth</Text>
          <View style={pickerStyles.row}>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>Year</Text>
              <ScrollView style={pickerStyles.scroll}>
                {years.map(y => (
                  <TouchableOpacity key={y} style={[pickerStyles.item, selectedYear === y && pickerStyles.itemActive]}
                    onPress={() => { setSelectedYear(y); setSelectedDay(1); }}>
                    <Text style={[pickerStyles.itemText, selectedYear === y && pickerStyles.itemTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>Month</Text>
              <ScrollView style={pickerStyles.scroll}>
                {months.map((m, i) => (
                  <TouchableOpacity key={m} style={[pickerStyles.item, selectedMonth === i && pickerStyles.itemActive]}
                    onPress={() => { setSelectedMonth(i); setSelectedDay(1); }}>
                    <Text style={[pickerStyles.itemText, selectedMonth === i && pickerStyles.itemTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>Day</Text>
              <ScrollView style={pickerStyles.scroll}>
                {days.map(d => (
                  <TouchableOpacity key={d} style={[pickerStyles.item, selectedDay === d && pickerStyles.itemActive]}
                    onPress={() => setSelectedDay(d)}>
                    <Text style={[pickerStyles.itemText, selectedDay === d && pickerStyles.itemTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={pickerStyles.buttons}>
            <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onCancel}>
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pickerStyles.confirmBtn} onPress={handleConfirm}>
              <Text style={pickerStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  scroll: { height: 180 },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  itemActive: { backgroundColor: Colors.primary + '20' },
  itemText: { fontSize: 16, color: Colors.textSecondary },
  itemTextActive: { color: Colors.primary, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.lightGray, alignItems: 'center' },
  cancelText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmText: { fontSize: 16, color: Colors.white, fontWeight: '700' },
});

export default function EditChildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: child, isLoading } = useQuery<any>({
    queryKey: [`/api/children/${id}`],
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
  const [gender, setGender] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (child) {
      setName(child.name || '');
      setDateOfBirth(child.dateOfBirth ? new Date(child.dateOfBirth) : new Date());
      setGender(child.gender || null);
    }
  }, [child]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/children/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${id}`] });
      Alert.alert('Saved', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/' as any) },
      ]);
    },
    onError: () => Alert.alert('Error', 'Could not update profile.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/children/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      router.replace('/(tabs)/' as any);
    },
    onError: () => Alert.alert('Error', 'Could not delete profile.'),
  });

  const handleDelete = () => {
    Alert.alert('Delete Profile', `Are you sure you want to delete ${name}'s profile? All data will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a name'); return; }
    updateMutation.mutate({ name: name.trim(), dateOfBirth: dateOfBirth.toISOString(), gender });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/' as any)}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          <Text style={[styles.saveText, updateMutation.isPending && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name={gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person'} size={56} color={Colors.white} />
        </View>
        <Text style={styles.avatarLabel}>{name || 'Baby'}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter child's name"
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>{formatDate(dateOfBirth)}</Text>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderOptions}>
          {(['male', 'female', 'other'] as const).map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.genderButton, gender === g && styles.genderButtonActive]}
              onPress={() => setGender(gender === g ? null : g)}
            >
              <Text style={[styles.genderButtonText, gender === g && styles.genderButtonTextActive]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, updateMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.submitButtonText}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={styles.deleteButtonText}>Delete Profile</Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        date={dateOfBirth}
        onConfirm={d => { setDateOfBirth(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  saveText: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLabel: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  form: { padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  input: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.lightGray },
  dateButton: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.lightGray },
  dateButtonText: { fontSize: 16, color: Colors.textPrimary },
  genderOptions: { flexDirection: 'row', gap: 10 },
  genderButton: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.lightGray },
  genderButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderButtonText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  genderButtonTextActive: { color: Colors.white },
  submitButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 36, marginBottom: 16 },
  submitButtonText: { fontSize: 17, fontWeight: 'bold', color: Colors.white },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, marginBottom: 40 },
  deleteButtonText: { fontSize: 16, color: Colors.danger, fontWeight: '600' },
});
