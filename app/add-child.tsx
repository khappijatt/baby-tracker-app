import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/query-client';

function DatePickerModal({
  visible,
  date,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  date: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedDay, setSelectedDay] = useState(date.getDate());

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    if (d > new Date()) {
      Alert.alert('Invalid date', 'Date of birth cannot be in the future.');
      return;
    }
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
                  <TouchableOpacity
                    key={y}
                    style={[pickerStyles.item, selectedYear === y && pickerStyles.itemActive]}
                    onPress={() => { setSelectedYear(y); setSelectedDay(1); }}
                  >
                    <Text style={[pickerStyles.itemText, selectedYear === y && pickerStyles.itemTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>Month</Text>
              <ScrollView style={pickerStyles.scroll}>
                {months.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[pickerStyles.item, selectedMonth === i && pickerStyles.itemActive]}
                    onPress={() => { setSelectedMonth(i); setSelectedDay(1); }}
                  >
                    <Text style={[pickerStyles.itemText, selectedMonth === i && pickerStyles.itemTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>Day</Text>
              <ScrollView style={pickerStyles.scroll}>
                {days.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[pickerStyles.item, selectedDay === d && pickerStyles.itemActive]}
                    onPress={() => setSelectedDay(d)}
                  >
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

export default function AddChildScreen() {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const addChildMutation = useMutation({
    mutationFn: async (childData: any) => {
      const url = new URL('/api/children', getApiUrl());
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childData),
      });
      if (!response.ok) throw new Error('Failed to add child');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      router.replace('/(tabs)/' as any);
    },
    onError: () => {
      Alert.alert('Error', 'Could not add child. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name');
      return;
    }
    addChildMutation.mutate({
      name: name.trim(),
      dateOfBirth: dateOfBirth.toISOString(),
      gender,
    });
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/' as any)}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Child</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter child's name"
          placeholderTextColor={Colors.textLight}
          autoFocus
        />

        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>{formatDate(dateOfBirth)}</Text>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={styles.label}>Gender (Optional)</Text>
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
          style={[styles.submitButton, addChildMutation.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={addChildMutation.isPending}
        >
          <Text style={styles.submitButtonText}>
            {addChildMutation.isPending ? 'Adding...' : 'Add Child'}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  dateButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  dateButtonText: { fontSize: 16, color: Colors.textPrimary },
  genderOptions: { flexDirection: 'row', gap: 10 },
  genderButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  genderButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderButtonText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  genderButtonTextActive: { color: Colors.white },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
});
