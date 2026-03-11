import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

type HealthTab = 'appointments' | 'vaccinations' | 'growth';

// ─── Inline date/time picker ─────────────────────────────────────────────────

function DatePickerModal({ visible, date, onConfirm, onCancel, title = 'Select Date' }: {
  visible: boolean; date: Date; onConfirm: (d: Date) => void; onCancel: () => void; title?: string;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 1 + i);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [sy, setSy] = useState(date.getFullYear());
  const [sm, setSm] = useState(date.getMonth());
  const [sd, setSd] = useState(date.getDate());
  const daysInMonth = new Date(sy, sm + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pk.overlay}>
        <View style={pk.sheet}>
          <View style={pk.handle} />
          <Text style={pk.title}>{title}</Text>
          <View style={pk.cols}>
            {[
              { label: 'Year', items: years.map(y => ({ val: y, lbl: String(y) })), sel: sy, set: (v: number) => { setSy(v); setSd(1); } },
              { label: 'Month', items: months.map((m, i) => ({ val: i, lbl: m })), sel: sm, set: (v: number) => { setSm(v); setSd(1); } },
              { label: 'Day', items: days.map(d => ({ val: d, lbl: String(d) })), sel: sd, set: setSd },
            ].map(col => (
              <View key={col.label} style={pk.col}>
                <Text style={pk.colLbl}>{col.label}</Text>
                <ScrollView style={pk.scroll} showsVerticalScrollIndicator={false}>
                  {col.items.map(item => (
                    <TouchableOpacity key={item.val} style={[pk.item, col.sel === item.val && pk.itemSel]}
                      onPress={() => col.set(item.val)}>
                      <Text style={[pk.itemTxt, col.sel === item.val && pk.itemSelTxt]}>{item.lbl}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
          <View style={pk.btns}>
            <TouchableOpacity style={pk.cancelBtn} onPress={onCancel}><Text style={pk.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={pk.confirmBtn} onPress={() => onConfirm(new Date(sy, sm, sd))}><Text style={pk.confirmTxt}>Confirm</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimePickerModal({ visible, hour, minute, onConfirm, onCancel }: {
  visible: boolean; hour: number; minute: number;
  onConfirm: (h: number, m: number) => void; onCancel: () => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const [sh, setSh] = useState(hour);
  const [sm, setSm] = useState(Math.round(minute / 5) * 5);
  const fmt2 = (n: number) => String(n).padStart(2, '0');
  const label12 = sh === 0 ? 12 : sh > 12 ? sh - 12 : sh;
  const ampm = sh < 12 ? 'AM' : 'PM';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pk.overlay}>
        <View style={pk.sheet}>
          <View style={pk.handle} />
          <Text style={pk.title}>Select Time</Text>
          <Text style={pk.timePrev}>{label12}:{fmt2(sm)} {ampm}</Text>
          <View style={pk.cols}>
            <View style={pk.col}>
              <Text style={pk.colLbl}>Hour</Text>
              <ScrollView style={pk.scroll} showsVerticalScrollIndicator={false}>
                {hours.map(h => (
                  <TouchableOpacity key={h} style={[pk.item, sh === h && pk.itemSel]} onPress={() => setSh(h)}>
                    <Text style={[pk.itemTxt, sh === h && pk.itemSelTxt]}>
                      {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={pk.col}>
              <Text style={pk.colLbl}>Minute</Text>
              <ScrollView style={pk.scroll} showsVerticalScrollIndicator={false}>
                {minutes.map(m => (
                  <TouchableOpacity key={m} style={[pk.item, sm === m && pk.itemSel]} onPress={() => setSm(m)}>
                    <Text style={[pk.itemTxt, sm === m && pk.itemSelTxt]}>{fmt2(m)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={pk.btns}>
            <TouchableOpacity style={pk.cancelBtn} onPress={onCancel}><Text style={pk.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={pk.confirmBtn} onPress={() => onConfirm(sh, sm)}><Text style={pk.confirmTxt}>Confirm</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pk = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36 },
  handle: { width: 36, height: 4, backgroundColor: Colors.lightGray, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  timePrev: { fontSize: 30, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 12 },
  cols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  colLbl: { fontSize: 11, fontWeight: '700', color: Colors.textLight, textAlign: 'center', marginBottom: 8 },
  scroll: { height: 160 },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  itemSel: { backgroundColor: Colors.primary + '20' },
  itemTxt: { fontSize: 15, color: Colors.textSecondary },
  itemSelTxt: { color: Colors.primary, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.lightGray, alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmTxt: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

// ─── Add Appointment Modal ────────────────────────────────────────────────────

function AddAppointmentModal({ visible, childId, onClose }: {
  visible: boolean; childId: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const now = new Date();
  const [aptType, setAptType] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [aptDate, setAptDate] = useState(now);
  const [aptH, setAptH] = useState(9);
  const [aptM, setAptM] = useState(0);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const APT_TYPES = ['Checkup', 'Vaccination', 'Sick visit', 'Follow-up', 'Dental', 'Eye exam', 'Other'];

  const reset = () => {
    setAptType(''); setDoctorName(''); setLocation(''); setNotes('');
    setAptDate(new Date()); setAptH(9); setAptM(0);
  };

  const fmt12 = (h: number, m: number) => {
    const ap = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const mut = useMutation({
    mutationFn: async () => {
      const d = new Date(aptDate); d.setHours(aptH, aptM, 0, 0);
      await apiRequest('POST', `/api/children/${childId}/appointments`, {
        appointmentDate: d.toISOString(),
        appointmentType: aptType || 'Checkup',
        doctorName: doctorName || undefined,
        location: location || undefined,
        notes: notes || undefined,
      });
      qc.invalidateQueries({ queryKey: [`/api/children/${childId}/appointments`] });
      qc.invalidateQueries({ queryKey: [`/api/children/${childId}/dashboard`] });
    },
    onSuccess: () => { reset(); onClose(); },
    onError: (e: any) => Alert.alert('Error', e.message || 'Could not save appointment'),
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={aptModal.overlay}>
        <View style={aptModal.sheet}>
          <View style={aptModal.handle} />
          <View style={aptModal.topRow}>
            <View style={aptModal.iconWrap}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <Text style={aptModal.title}>New Appointment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={Colors.lightGray} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={aptModal.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {APT_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[aptModal.typeChip, aptType === t && aptModal.typeChipActive]}
                  onPress={() => setAptType(t)}
                >
                  <Text style={[aptModal.typeChipText, aptType === t && aptModal.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={aptModal.label}>Date & Time</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[aptModal.whenBtn, { flex: 1.2 }]} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={aptModal.whenText}>
                  {aptDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[aptModal.whenBtn, { flex: 1 }]} onPress={() => setShowTime(true)}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={aptModal.whenText}>{fmt12(aptH, aptM)}</Text>
              </TouchableOpacity>
            </View>

            <Text style={aptModal.label}>Doctor / Clinic</Text>
            <TextInput style={aptModal.input} value={doctorName} onChangeText={setDoctorName}
              placeholder="Dr. Smith or City Medical" placeholderTextColor={Colors.textLight} />

            <Text style={aptModal.label}>Location</Text>
            <TextInput style={aptModal.input} value={location} onChangeText={setLocation}
              placeholder="Address or clinic name" placeholderTextColor={Colors.textLight} />

            <Text style={aptModal.label}>Notes</Text>
            <TextInput style={[aptModal.input, { height: 70 }]} value={notes} onChangeText={setNotes}
              placeholder="Questions to ask, reminders..." placeholderTextColor={Colors.textLight} multiline />

            <TouchableOpacity
              style={[aptModal.saveBtn, mut.isPending && { opacity: 0.6 }]}
              onPress={() => mut.mutate()} disabled={mut.isPending}
            >
              <Text style={aptModal.saveBtnText}>{mut.isPending ? 'Saving...' : 'Book Appointment'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      <DatePickerModal visible={showDate} date={aptDate} title="Appointment Date"
        onConfirm={d => { setAptDate(d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
      <TimePickerModal visible={showTime} hour={aptH} minute={aptM}
        onConfirm={(h, m) => { setAptH(h); setAptM(m); setShowTime(false); }} onCancel={() => setShowTime(false)} />
    </Modal>
  );
}

const aptModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingHorizontal: 22, paddingTop: 14 },
  handle: { width: 36, height: 4, backgroundColor: Colors.lightGray, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 16, marginBottom: 8, letterSpacing: 0.3 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.veryLightGray, borderWidth: 1.5, borderColor: Colors.lightGray },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white },
  whenBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.veryLightGray, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: Colors.lightGray },
  whenText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  input: { backgroundColor: Colors.veryLightGray, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.lightGray },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 22 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});

// ─── Add Growth Modal ─────────────────────────────────────────────────────────

function AddGrowthModal({ visible, childId, onClose }: { visible: boolean; childId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      if (!weight && !height && !head) throw new Error('Enter at least one measurement');
      await apiRequest('POST', `/api/children/${childId}/growth`, {
        measurementDate: date.toISOString(),
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        headCircumference: head ? parseFloat(head) : undefined,
        notes: notes || undefined,
      });
      qc.invalidateQueries({ queryKey: [`/api/children/${childId}/growth`] });
    },
    onSuccess: () => { setWeight(''); setHeight(''); setHead(''); setNotes(''); onClose(); },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to save'),
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={aptModal.overlay}>
        <View style={aptModal.sheet}>
          <View style={aptModal.handle} />
          <View style={aptModal.topRow}>
            <View style={[aptModal.iconWrap, { backgroundColor: Colors.secondaryLight }]}>
              <Ionicons name="trending-up" size={20} color={Colors.secondary} />
            </View>
            <Text style={aptModal.title}>Log Measurement</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color={Colors.lightGray} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={aptModal.label}>Date</Text>
            <TouchableOpacity style={[aptModal.whenBtn, { flex: 1 }]} onPress={() => setShowDate(true)}>
              <Ionicons name="calendar-outline" size={16} color={Colors.secondary} />
              <Text style={aptModal.whenText}>{date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={aptModal.label}>Weight (kg)</Text><TextInput style={aptModal.input} value={weight} onChangeText={setWeight} placeholder="7.5" keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} /></View>
              <View style={{ flex: 1 }}><Text style={aptModal.label}>Height (cm)</Text><TextInput style={aptModal.input} value={height} onChangeText={setHeight} placeholder="68" keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} /></View>
              <View style={{ flex: 1 }}><Text style={aptModal.label}>Head (cm)</Text><TextInput style={aptModal.input} value={head} onChangeText={setHead} placeholder="42" keyboardType="decimal-pad" placeholderTextColor={Colors.textLight} /></View>
            </View>
            <Text style={aptModal.label}>Notes</Text>
            <TextInput style={[aptModal.input, { height: 60 }]} value={notes} onChangeText={setNotes} placeholder="Add notes..." placeholderTextColor={Colors.textLight} multiline />
            <TouchableOpacity style={[aptModal.saveBtn, { backgroundColor: Colors.secondary }, mut.isPending && { opacity: 0.6 }]}
              onPress={() => mut.mutate()} disabled={mut.isPending}>
              <Text style={aptModal.saveBtnText}>{mut.isPending ? 'Saving...' : 'Save Measurement'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
      <DatePickerModal visible={showDate} date={date} title="Measurement Date"
        onConfirm={d => { setDate(d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
    </Modal>
  );
}

// ─── Add Vaccine Modal ────────────────────────────────────────────────────────

function AddVaccineModal({ visible, childId, onClose }: { visible: boolean; childId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [vaccineName, setVaccineName] = useState('');
  const [scheduledAge, setScheduledAge] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [administeredDate, setAdministeredDate] = useState(new Date());
  const [showAdminDate, setShowAdminDate] = useState(false);
  const [reactions, setReactions] = useState('');

  const COMMON_VACCINES = ['BCG', 'Hepatitis B', 'DTaP', 'Polio (IPV)', 'Hib', 'PCV', 'Rotavirus', 'MMR', 'Varicella', 'Hepatitis A', 'Influenza', 'COVID-19'];

  const reset = () => {
    setVaccineName(''); setScheduledAge(''); setNotes('');
    setCompleted(false); setReactions(''); setDueDate(new Date()); setAdministeredDate(new Date());
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!vaccineName.trim()) throw new Error('Vaccine name is required');
      await apiRequest('POST', `/api/children/${childId}/vaccinations`, {
        vaccineName: vaccineName.trim(),
        scheduledAge: scheduledAge || undefined,
        dueDate: !completed ? dueDate.toISOString() : undefined,
        administeredDate: completed ? administeredDate.toISOString() : undefined,
        completed,
        notes: notes || undefined,
        reactions: reactions || undefined,
      });
      qc.invalidateQueries({ queryKey: [`/api/children/${childId}/vaccinations`] });
      qc.invalidateQueries({ queryKey: [`/api/children/${childId}/dashboard`] });
    },
    onSuccess: () => { reset(); onClose(); },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to save vaccine'),
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={aptModal.overlay}>
        <View style={aptModal.sheet}>
          <View style={aptModal.handle} />
          <View style={aptModal.topRow}>
            <View style={[aptModal.iconWrap, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            </View>
            <Text style={aptModal.title}>Add Vaccine</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color={Colors.lightGray} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={aptModal.label}>Vaccine Name *</Text>
            <TextInput
              style={aptModal.input}
              value={vaccineName}
              onChangeText={setVaccineName}
              placeholder="e.g. DTaP, MMR, Hepatitis B"
              placeholderTextColor={Colors.textLight}
            />
            <Text style={aptModal.label}>Common Vaccines</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {COMMON_VACCINES.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[aptModal.typeChip, vaccineName === v && { ...aptModal.typeChipActive, borderColor: Colors.success, backgroundColor: Colors.success }]}
                  onPress={() => setVaccineName(v)}
                >
                  <Text style={[aptModal.typeChipText, vaccineName === v && aptModal.typeChipTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={aptModal.label}>Scheduled Age</Text>
            <TextInput
              style={aptModal.input}
              value={scheduledAge}
              onChangeText={setScheduledAge}
              placeholder="e.g. 2 months, 6 months, 1 year"
              placeholderTextColor={Colors.textLight}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
              <Text style={[aptModal.label, { marginTop: 0, marginBottom: 0 }]}>Already Administered?</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: completed ? Colors.successLight : Colors.veryLightGray, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: completed ? Colors.success : Colors.lightGray }}
                onPress={() => setCompleted(!completed)}
              >
                <Ionicons name={completed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={completed ? Colors.success : Colors.textLight} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: completed ? Colors.success : Colors.textSecondary }}>{completed ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
            </View>

            {completed ? (
              <>
                <Text style={aptModal.label}>Date Administered</Text>
                <TouchableOpacity style={aptModal.whenBtn} onPress={() => setShowAdminDate(true)}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.success} />
                  <Text style={aptModal.whenText}>{administeredDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </TouchableOpacity>
                <Text style={aptModal.label}>Reactions / Side Effects</Text>
                <TextInput style={aptModal.input} value={reactions} onChangeText={setReactions} placeholder="None, mild fever, redness..." placeholderTextColor={Colors.textLight} />
              </>
            ) : (
              <>
                <Text style={aptModal.label}>Due Date</Text>
                <TouchableOpacity style={aptModal.whenBtn} onPress={() => setShowDate(true)}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.warning} />
                  <Text style={aptModal.whenText}>{dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={aptModal.label}>Notes</Text>
            <TextInput style={[aptModal.input, { height: 60 }]} value={notes} onChangeText={setNotes} placeholder="Batch number, clinic, observations..." placeholderTextColor={Colors.textLight} multiline />

            <TouchableOpacity style={[aptModal.saveBtn, { backgroundColor: Colors.success }, mut.isPending && { opacity: 0.6 }]}
              onPress={() => mut.mutate()} disabled={mut.isPending}>
              <Text style={aptModal.saveBtnText}>{mut.isPending ? 'Saving...' : 'Save Vaccine'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
      <DatePickerModal visible={showDate} date={dueDate} title="Due Date"
        onConfirm={d => { setDueDate(d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
      <DatePickerModal visible={showAdminDate} date={administeredDate} title="Date Administered"
        onConfirm={d => { setAdministeredDate(d); setShowAdminDate(false); }} onCancel={() => setShowAdminDate(false)} />
    </Modal>
  );
}

// ─── Health Screen ────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const [selectedTab, setSelectedTab] = useState<HealthTab>('appointments');
  const [showAptModal, setShowAptModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showVaccModal, setShowVaccModal] = useState(false);
  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });
  const child = children[0];

  const TABS = [
    { key: 'appointments' as HealthTab, icon: 'calendar', label: 'Appointments', color: Colors.primary },
    { key: 'vaccinations' as HealthTab, icon: 'shield-checkmark', label: 'Vaccines', color: Colors.success },
    { key: 'growth' as HealthTab, icon: 'trending-up', label: 'Growth', color: Colors.secondary },
  ];

  const getFabProps = () => {
    if (selectedTab === 'appointments') return { color: Colors.primary, show: true, action: () => setShowAptModal(true) };
    if (selectedTab === 'vaccinations') return { color: Colors.success, show: true, action: () => setShowVaccModal(true) };
    if (selectedTab === 'growth') return { color: Colors.secondary, show: true, action: () => setShowGrowthModal(true) };
    return { color: Colors.success, show: false, action: () => {} };
  };
  const fab = getFabProps();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2ECC71', '#4A90D9']} style={styles.header}>
        <Text style={styles.headerTitle}>Health</Text>
        <Text style={styles.headerSub}>Track appointments, vaccines & growth</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, selectedTab === t.key && { borderBottomColor: t.color, borderBottomWidth: 3 }]}
            onPress={() => setSelectedTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={18} color={selectedTab === t.key ? t.color : Colors.textLight} />
            <Text style={[styles.tabLabel, selectedTab === t.key && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {selectedTab === 'appointments' && <AppointmentsTab childId={child?.id} />}
        {selectedTab === 'vaccinations' && <VaccinationsTab childId={child?.id} />}
        {selectedTab === 'growth' && <GrowthTab childId={child?.id} />}
      </View>

      {fab.show && child && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: fab.color }]} onPress={fab.action}>
          <Ionicons name="add" size={30} color={Colors.white} />
        </TouchableOpacity>
      )}

      {child && (
        <>
          <AddAppointmentModal visible={showAptModal} childId={child.id} onClose={() => setShowAptModal(false)} />
          <AddGrowthModal visible={showGrowthModal} childId={child.id} onClose={() => setShowGrowthModal(false)} />
          <AddVaccineModal visible={showVaccModal} childId={child.id} onClose={() => setShowVaccModal(false)} />
        </>
      )}
    </View>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────

function AppointmentsTab({ childId }: { childId?: string }) {
  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${childId}/appointments`],
    enabled: !!childId,
  });

  const upcoming = appointments.filter((a: any) => !a.completed && new Date(a.appointmentDate) >= new Date());
  const past = appointments.filter((a: any) => a.completed || new Date(a.appointmentDate) < new Date());

  if (!childId || appointments.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="calendar-outline" size={44} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{!childId ? 'Add a child first' : 'No appointments yet'}</Text>
        <Text style={styles.emptyHint}>Tap + to add your first appointment</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {upcoming.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Upcoming</Text>
          {upcoming.map((a: any) => <AptCard key={a.id} appointment={a} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Past</Text>
          {past.map((a: any) => <AptCard key={a.id} appointment={a} past />)}
        </>
      )}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

function AptCard({ appointment, past = false }: { appointment: any; past?: boolean }) {
  const daysUntil = Math.ceil((new Date(appointment.appointmentDate).getTime() - Date.now()) / 86400000);
  const isToday = daysUntil === 0;
  const isSoon = daysUntil > 0 && daysUntil <= 3;

  return (
    <View style={[styles.card, past && { opacity: 0.55 }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: Colors.primaryLight }]}>
          <Ionicons name="calendar" size={22} color={Colors.primary} />
        </View>
        {!past && isToday && <View style={[styles.urgentDot, { backgroundColor: Colors.danger }]} />}
        {!past && isSoon && !isToday && <View style={[styles.urgentDot, { backgroundColor: Colors.warning }]} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{appointment.appointmentType || 'Appointment'}</Text>
        {appointment.doctorName ? <Text style={styles.cardSub}>{appointment.doctorName}</Text> : null}
        <Text style={styles.cardDate}>{formatDateTime(appointment.appointmentDate)}</Text>
        {appointment.location ? (
          <View style={styles.cardLocRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textLight} />
            <Text style={styles.cardLoc}>{appointment.location}</Text>
          </View>
        ) : null}
        {appointment.notes ? <Text style={styles.cardNotes}>{appointment.notes}</Text> : null}
      </View>
      {appointment.completed
        ? <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        : !past && daysUntil >= 0
        ? <View style={[styles.daysBadge, { backgroundColor: isToday ? Colors.dangerLight : isSoon ? Colors.warningLight : Colors.primaryLight }]}>
            <Text style={[styles.daysBadgeText, { color: isToday ? Colors.danger : isSoon ? Colors.warning : Colors.primary }]}>
              {isToday ? 'Today' : `${daysUntil}d`}
            </Text>
          </View>
        : null
      }
    </View>
  );
}

// ─── Vaccinations Tab ─────────────────────────────────────────────────────────

function VaccinationsTab({ childId }: { childId?: string }) {
  const { data: vaccinations = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${childId}/vaccinations`],
    enabled: !!childId,
  });

  const pending = vaccinations.filter((v: any) => !v.completed);
  const done = vaccinations.filter((v: any) => v.completed);

  if (!childId || vaccinations.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: Colors.successLight }]}>
          <Ionicons name="shield-checkmark-outline" size={44} color={Colors.success} />
        </View>
        <Text style={styles.emptyTitle}>{!childId ? 'Add a child first' : 'No vaccinations tracked'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {pending.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Pending</Text>
          {pending.map((v: any) => <VaccCard key={v.id} vaccination={v} />)}
        </>
      )}
      {done.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Completed</Text>
          {done.map((v: any) => <VaccCard key={v.id} vaccination={v} completed />)}
        </>
      )}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

function VaccCard({ vaccination, completed = false }: { vaccination: any; completed?: boolean }) {
  return (
    <View style={[styles.card, completed && { opacity: 0.6 }]}>
      <View style={[styles.cardIconWrap, { backgroundColor: completed ? Colors.successLight : Colors.warningLight }]}>
        <Ionicons name={completed ? 'shield-checkmark' : 'shield-outline'} size={22} color={completed ? Colors.success : Colors.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{vaccination.vaccineName}</Text>
        {vaccination.scheduledAge ? <Text style={styles.cardSub}>{vaccination.scheduledAge}</Text> : null}
        {vaccination.dueDate && !completed ? <Text style={[styles.cardDate, { color: Colors.warning }]}>Due: {formatDate(vaccination.dueDate)}</Text> : null}
        {vaccination.administeredDate ? <Text style={styles.cardDate}>Given: {formatDate(vaccination.administeredDate)}</Text> : null}
        {vaccination.reactions ? <Text style={styles.cardNotes}>Reactions: {vaccination.reactions}</Text> : null}
      </View>
      {completed && <Ionicons name="checkmark-circle" size={22} color={Colors.success} />}
    </View>
  );
}

// ─── Growth Tab ───────────────────────────────────────────────────────────────

function GrowthTab({ childId }: { childId?: string }) {
  const { data: measurements = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${childId}/growth`],
    enabled: !!childId,
  });

  if (!childId || measurements.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: Colors.secondaryLight }]}>
          <Ionicons name="trending-up-outline" size={44} color={Colors.secondary} />
        </View>
        <Text style={styles.emptyTitle}>{!childId ? 'Add a child first' : 'No measurements yet'}</Text>
        <Text style={styles.emptyHint}>Tap + to log weight, height & head size</Text>
      </View>
    );
  }

  const latest = measurements[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        {latest.weight != null && (
          <View style={styles.statCard}>
            <LinearGradient colors={['#FF6B9D', '#E8547A']} style={styles.statIcon}>
              <Ionicons name="scale" size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{latest.weight}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
        )}
        {latest.height != null && (
          <View style={styles.statCard}>
            <LinearGradient colors={['#667EEA', '#4A90D9']} style={styles.statIcon}>
              <Ionicons name="resize" size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{latest.height}</Text>
            <Text style={styles.statUnit}>cm</Text>
          </View>
        )}
        {latest.headCircumference != null && (
          <View style={styles.statCard}>
            <LinearGradient colors={['#4ECDC4', '#2ECC71']} style={styles.statIcon}>
              <Ionicons name="ellipse" size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{latest.headCircumference}</Text>
            <Text style={styles.statUnit}>cm</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>History</Text>
      {measurements.map((m: any) => (
        <View key={m.id} style={styles.card}>
          <View style={[styles.cardIconWrap, { backgroundColor: Colors.secondaryLight }]}>
            <Ionicons name="analytics" size={22} color={Colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardDate}>{formatDate(m.measurementDate)}</Text>
            <View style={styles.measureRow}>
              {m.weight != null && <View style={styles.measureChip}><Text style={styles.measureTxt}>{m.weight} kg</Text></View>}
              {m.height != null && <View style={[styles.measureChip, { backgroundColor: Colors.secondaryLight }]}><Text style={[styles.measureTxt, { color: Colors.secondary }]}>{m.height} cm</Text></View>}
              {m.headCircumference != null && <View style={[styles.measureChip, { backgroundColor: Colors.tealLight }]}><Text style={[styles.measureTxt, { color: Colors.teal }]}>{m.headCircumference} cm</Text></View>}
            </View>
            {m.notes ? <Text style={styles.cardNotes}>{m.notes}</Text> : null}
          </View>
        </View>
      ))}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingTop: Platform.OS === 'web' ? 67 : 56, paddingHorizontal: 22, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  sectionLabel: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginTop: 6, marginBottom: 12 },

  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardLeft: { position: 'relative' },
  cardIconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  urgentDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.white },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  cardLoc: { fontSize: 12, color: Colors.textLight },
  cardNotes: { fontSize: 12, color: Colors.textLight, marginTop: 4, fontStyle: 'italic' },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  daysBadgeText: { fontSize: 12, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 18, padding: 16, alignItems: 'center', gap: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  statIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statUnit: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  measureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  measureChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  measureTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
});
