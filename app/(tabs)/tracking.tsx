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
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';

const { width } = Dimensions.get('window');

type TrackingTab = 'feeding' | 'diaper' | 'sleep' | 'medicine' | 'reminder';

const TABS: { key: TrackingTab; icon: string; label: string; color: string; bg: string }[] = [
  { key: 'feeding', icon: 'nutrition', label: 'Feeding', color: Colors.primary, bg: Colors.primaryLight },
  { key: 'diaper', icon: 'water', label: 'Diaper', color: Colors.teal, bg: Colors.tealLight },
  { key: 'sleep', icon: 'moon', label: 'Sleep', color: Colors.purple, bg: Colors.purpleLight },
  { key: 'medicine', icon: 'medkit', label: 'Medicine', color: Colors.coral, bg: Colors.coralLight },
  { key: 'reminder', icon: 'notifications', label: 'Reminder', color: Colors.secondary, bg: Colors.secondaryLight },
];

// ─── Date/Time Pickers ────────────────────────────────────────────────────────

function DatePickerModal({ visible, date, onConfirm, onCancel }: {
  visible: boolean; date: Date;
  onConfirm: (d: Date) => void; onCancel: () => void;
}) {
  const now = new Date();
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 5 + i);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [sy, setSy] = useState(date.getFullYear());
  const [sm, setSm] = useState(date.getMonth());
  const [sd, setSd] = useState(date.getDate());
  const daysInMonth = new Date(sy, sm + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={picker.overlay}>
        <View style={picker.sheet}>
          <View style={picker.handle} />
          <Text style={picker.title}>Select Date</Text>
          <View style={picker.cols}>
            {[
              { label: 'Year', items: years.map(y => ({ val: y, label: String(y) })), sel: sy, setSel: (v: number) => { setSy(v); setSd(1); } },
              { label: 'Month', items: months.map((m, i) => ({ val: i, label: m })), sel: sm, setSel: (v: number) => { setSm(v); setSd(1); } },
              { label: 'Day', items: days.map(d => ({ val: d, label: String(d) })), sel: sd, setSel: setSd },
            ].map(col => (
              <View key={col.label} style={picker.col}>
                <Text style={picker.colLabel}>{col.label}</Text>
                <ScrollView style={picker.scroll} showsVerticalScrollIndicator={false}>
                  {col.items.map(item => (
                    <TouchableOpacity key={item.val} style={[picker.item, col.sel === item.val && picker.itemSel]}
                      onPress={() => col.setSel(item.val)}>
                      <Text style={[picker.itemText, col.sel === item.val && picker.itemSelText]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
          <View style={picker.btns}>
            <TouchableOpacity style={picker.cancelBtn} onPress={onCancel}>
              <Text style={picker.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={picker.confirmBtn} onPress={() => onConfirm(new Date(sy, sm, sd))}>
              <Text style={picker.confirmText}>Confirm</Text>
            </TouchableOpacity>
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
      <View style={picker.overlay}>
        <View style={picker.sheet}>
          <View style={picker.handle} />
          <Text style={picker.title}>Select Time</Text>
          <Text style={picker.timePrev}>{label12}:{fmt2(sm)} {ampm}</Text>
          <View style={picker.cols}>
            <View style={picker.col}>
              <Text style={picker.colLabel}>Hour</Text>
              <ScrollView style={picker.scroll} showsVerticalScrollIndicator={false}>
                {hours.map(h => (
                  <TouchableOpacity key={h} style={[picker.item, sh === h && picker.itemSel]} onPress={() => setSh(h)}>
                    <Text style={[picker.itemText, sh === h && picker.itemSelText]}>
                      {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={picker.col}>
              <Text style={picker.colLabel}>Minute</Text>
              <ScrollView style={picker.scroll} showsVerticalScrollIndicator={false}>
                {minutes.map(m => (
                  <TouchableOpacity key={m} style={[picker.item, sm === m && picker.itemSel]} onPress={() => setSm(m)}>
                    <Text style={[picker.itemText, sm === m && picker.itemSelText]}>{fmt2(m)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={picker.btns}>
            <TouchableOpacity style={picker.cancelBtn} onPress={onCancel}>
              <Text style={picker.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={picker.confirmBtn} onPress={() => onConfirm(sh, sm)}>
              <Text style={picker.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const picker = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36 },
  handle: { width: 36, height: 4, backgroundColor: Colors.lightGray, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  timePrev: { fontSize: 30, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 12 },
  cols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },
  scroll: { height: 160 },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  itemSel: { backgroundColor: Colors.primary + '20' },
  itemText: { fontSize: 15, color: Colors.textSecondary },
  itemSelText: { color: Colors.primary, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.lightGray, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TrackingScreen() {
  const [activeTab, setActiveTab] = useState<TrackingTab>('feeding');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentTabConfig = TABS.find(t => t.key === activeTab)!;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B9D', '#667EEA']} style={styles.header}>
        <Text style={styles.headerTitle}>Tracking</Text>
        <Text style={styles.headerSub}>Log your baby's day</Text>
      </LinearGradient>

      <View style={styles.tabGrid}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && { backgroundColor: t.color }]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === t.key ? t.icon as any : `${t.icon}-outline` as any}
              size={22}
              color={activeTab === t.key ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabItemLabel, activeTab === t.key && { color: Colors.white }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'feeding' && <LogList type="feeding" color={Colors.primary} onAdd={() => setShowAddModal(true)} />}
        {activeTab === 'diaper' && <LogList type="diaper" color={Colors.teal} onAdd={() => setShowAddModal(true)} />}
        {activeTab === 'sleep' && <LogList type="sleep" color={Colors.purple} onAdd={() => setShowAddModal(true)} />}
        {activeTab === 'medicine' && <LogList type="medicine" color={Colors.coral} onAdd={() => setShowAddModal(true)} />}
        {activeTab === 'reminder' && <ScheduleTab />}
      </View>

      {activeTab !== 'reminder' && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: currentTabConfig.color }]} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={30} color={Colors.white} />
        </TouchableOpacity>
      )}

      <AddModal visible={showAddModal} tab={activeTab} onClose={() => setShowAddModal(false)} />
    </View>
  );
}

// ─── Log List ─────────────────────────────────────────────────────────────────

function LogList({ type, color, onAdd }: { type: string; color: string; onAdd: () => void }) {
  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });
  const child = children[0];
  const { data: logs = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${child?.id}/${type}`],
    enabled: !!child,
  });

  const iconMap: Record<string, string> = { feeding: 'nutrition', diaper: 'water', sleep: 'moon', medicine: 'medkit' };

  if (!child || logs.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={`${iconMap[type]}-outline` as any} size={48} color={color} />
        </View>
        <Text style={styles.emptyTitle}>{!child ? 'Add a child first' : `No ${type} logs yet`}</Text>
        {child && (
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: color }]} onPress={onAdd}>
            <Text style={styles.emptyBtnText}>Log {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const getLabel = (log: any) => {
    if (type === 'feeding') return log.type || 'feeding';
    if (type === 'diaper') return log.type || 'change';
    if (type === 'sleep') return log.sleepType || 'sleep';
    if (type === 'medicine') return log.medicineName || 'medicine';
    return type;
  };

  const getDetail = (log: any) => {
    if (type === 'feeding') {
      const p = [log.amount, log.duration && `${log.duration} min`].filter(Boolean);
      return p.join(' · ');
    }
    if (type === 'diaper') return [log.consistency, log.color].filter(Boolean).join(' · ');
    if (type === 'sleep' && log.duration) {
      const h = Math.floor(log.duration / 60), m = log.duration % 60;
      return h ? `${h}h ${m}m` : `${m}m`;
    }
    if (type === 'medicine') return `${log.dosage}${log.frequency ? ` · ${log.frequency}` : ''}`;
    return '';
  };

  const getTime = (log: any) => {
    const ts = type === 'sleep' ? log.startTime : log.timestamp;
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? t : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${t}`;
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {logs.map((log: any) => (
        <View key={log.id} style={styles.logCard}>
          <View style={[styles.logIconWrap, { backgroundColor: color + '18' }]}>
            <Ionicons name={iconMap[type] as any} size={22} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logTitle}>{getLabel(log)}</Text>
            {getDetail(log) ? <Text style={styles.logDetail}>{getDetail(log)}</Text> : null}
            {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
          </View>
          <Text style={styles.logTime}>{getTime(log)}</Text>
        </View>
      ))}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

const INTERVALS = [
  { label: '1h', min: 60 }, { label: '1.5h', min: 90 }, { label: '2h', min: 120 },
  { label: '2.5h', min: 150 }, { label: '3h', min: 180 }, { label: '3.5h', min: 210 }, { label: '4h', min: 240 },
];

function ScheduleTab() {
  const qc = useQueryClient();
  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });
  const child = children[0];
  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${child?.id}/schedule`], enabled: !!child,
  });
  const { data: lastLogs = [] } = useQuery<any[]>({
    queryKey: [`/api/children/${child?.id}/feeding`], enabled: !!child,
  });

  const [showForm, setShowForm] = useState(false);
  const [intervalMin, setIntervalMin] = useState(180);
  const [reminder, setReminder] = useState(true);
  const [notes, setNotes] = useState('');

  const active = schedules.find((s: any) => s.isActive);
  const lastFed = lastLogs[0];
  const nextTime = active && lastFed
    ? new Date(new Date(lastFed.timestamp).getTime() + active.intervalMinutes * 60000)
    : null;
  const minsLeft = nextTime ? Math.round((nextTime.getTime() - Date.now()) / 60000) : null;

  const addMut = useMutation({
    mutationFn: (d: any) => apiRequest('POST', `/api/children/${child?.id}/schedule`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/children/${child?.id}/schedule`] }); setShowForm(false); setNotes(''); },
    onError: () => Alert.alert('Error', 'Could not save schedule'),
  });
  const updMut = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest('PUT', `/api/schedule/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/children/${child?.id}/schedule`] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/schedule/${id}`, undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/children/${child?.id}/schedule`] }),
  });

  if (!child) {
    return (
      <View style={styles.empty}>
        <Ionicons name="alarm-outline" size={56} color={Colors.lightGray} />
        <Text style={styles.emptyTitle}>Add a child first</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {active && (
        <LinearGradient colors={['#FF6B9D', '#667EEA']} style={styles.nextCard}>
          <View style={styles.nextCardLeft}>
            <Text style={styles.nextCardLabel}>
              {minsLeft == null
                ? 'Set a feeding log to start countdown'
                : minsLeft <= 0
                ? 'Time to feed!'
                : minsLeft < 60
                ? `Feed in ${minsLeft}m`
                : `Feed in ${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`}
            </Text>
            {nextTime && (
              <Text style={styles.nextCardTime}>
                {nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {lastFed && (
              <Text style={styles.nextCardSub}>
                Last fed: {new Date(lastFed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={styles.nextCardIcon}>
            <Ionicons name="nutrition" size={32} color={Colors.white} />
            {minsLeft !== null && minsLeft <= 0 && (
              <View style={styles.alertDot} />
            )}
          </View>
        </LinearGradient>
      )}

      {schedules.map((s: any) => (
        <View key={s.id} style={[styles.schedCard, !s.isActive && { opacity: 0.5 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.schedTitle}>
              Every {s.intervalMinutes >= 60
                ? `${s.intervalMinutes / 60 % 1 === 0 ? s.intervalMinutes / 60 : (s.intervalMinutes / 60).toFixed(1)}h`
                : `${s.intervalMinutes}m`}
            </Text>
            {s.notes ? <Text style={styles.schedNotes}>{s.notes}</Text> : null}
            {s.isActive && <View style={styles.activePill}><Text style={styles.activePillText}>Active</Text></View>}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: s.isActive ? Colors.lightGray : Colors.secondaryLight }]}
              onPress={() => updMut.mutate({ id: s.id, data: { isActive: !s.isActive } })}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: s.isActive ? Colors.textSecondary : Colors.secondary }}>
                {s.isActive ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Delete', 'Remove this schedule?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => delMut.mutate(s.id) },
            ])}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!showForm ? (
        <TouchableOpacity style={styles.addSchedBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle" size={22} color={Colors.secondary} />
          <Text style={styles.addSchedText}>Add Feed Schedule</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.schedForm}>
          <Text style={styles.schedFormTitle}>New Schedule</Text>
          <Text style={styles.formLabel}>Interval</Text>
          <View style={styles.intervalRow}>
            {INTERVALS.map(opt => (
              <TouchableOpacity
                key={opt.min}
                style={[styles.intervalChip, intervalMin === opt.min && styles.intervalChipActive]}
                onPress={() => setIntervalMin(opt.min)}
              >
                <Text style={[styles.intervalChipText, intervalMin === opt.min && styles.intervalChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Reminder</Text>
            <Switch value={reminder} onValueChange={setReminder}
              trackColor={{ false: Colors.lightGray, true: Colors.secondary }} />
          </View>
          <Text style={styles.formLabel}>Notes</Text>
          <TextInput style={styles.formInput} value={notes} onChangeText={setNotes}
            placeholder="e.g. Breastfeeding schedule" placeholderTextColor={Colors.textLight} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.formCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.formSaveBtn}
              onPress={() => addMut.mutate({ intervalMinutes: intervalMin, reminderEnabled: reminder, notes: notes || null, isActive: true })}
              disabled={addMut.isPending}>
              <Text style={styles.formSaveText}>{addMut.isPending ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddModal({ visible, tab, onClose }: { visible: boolean; tab: TrackingTab; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });
  const child = children[0];

  const now = new Date();
  const [logDate, setLogDate] = useState(now);
  const [logH, setLogH] = useState(now.getHours());
  const [logM, setLogM] = useState(Math.round(now.getMinutes() / 5) * 5);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [feedType, setFeedType] = useState<'breast' | 'bottle' | 'solid'>('bottle');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [diaperType, setDiaperType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [consistency, setConsistency] = useState('');
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [sleepDur, setSleepDur] = useState('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const getTs = () => {
    const d = new Date(logDate);
    d.setHours(logH, logM, 0, 0);
    return d.toISOString();
  };

  const fmt12 = (h: number, m: number) => {
    const ap = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const reset = () => {
    const n = new Date(); setLogDate(n); setLogH(n.getHours());
    setLogM(Math.round(n.getMinutes() / 5) * 5);
    setAmount(''); setDuration(''); setNotes(''); setConsistency('');
    setSleepDur(''); setMedName(''); setDosage(''); setFrequency('');
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!child) throw new Error('No child');
      const ts = getTs();
      const id = child.id;
      if (tab === 'feeding') {
        await apiRequest('POST', `/api/children/${id}/feeding`, {
          timestamp: ts, type: feedType,
          amount: amount || undefined, duration: duration ? parseInt(duration) : undefined,
          notes: notes || undefined,
        });
        qc.invalidateQueries({ queryKey: [`/api/children/${id}/feeding`] });
      } else if (tab === 'diaper') {
        await apiRequest('POST', `/api/children/${id}/diaper`, {
          timestamp: ts, type: diaperType, consistency: consistency || undefined, notes: notes || undefined,
        });
        qc.invalidateQueries({ queryKey: [`/api/children/${id}/diaper`] });
      } else if (tab === 'sleep') {
        const st = new Date(logDate); st.setHours(logH, logM, 0, 0);
        await apiRequest('POST', `/api/children/${id}/sleep`, {
          startTime: st.toISOString(), sleepType,
          duration: sleepDur ? parseInt(sleepDur) : undefined, notes: notes || undefined,
        });
        qc.invalidateQueries({ queryKey: [`/api/children/${id}/sleep`] });
      } else if (tab === 'medicine') {
        if (!medName || !dosage) throw new Error('Name and dosage required');
        await apiRequest('POST', `/api/children/${id}/medicine`, {
          timestamp: ts, medicineName: medName, dosage,
          frequency: frequency || undefined, notes: notes || undefined,
        });
        qc.invalidateQueries({ queryKey: [`/api/children/${id}/medicine`] });
      }
      qc.invalidateQueries({ queryKey: [`/api/children/${id}/dashboard`] });
    },
    onSuccess: () => { reset(); onClose(); },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to save'),
  });

  const TITLE: Partial<Record<TrackingTab, string>> = {
    feeding: 'Log Feeding', diaper: 'Log Diaper', sleep: 'Log Sleep', medicine: 'Log Medicine',
  };
  const tabCfg = TABS.find(t => t.key === tab)!;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.topRow}>
            <View style={[modal.typeIcon, { backgroundColor: tabCfg?.bg }]}>
              <Ionicons name={tabCfg?.icon as any} size={20} color={tabCfg?.color} />
            </View>
            <Text style={modal.title}>{TITLE[tab]}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color={Colors.lightGray} /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={modal.label}>When</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[modal.whenBtn, { flex: 1.3 }]} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar" size={15} color={tabCfg?.color} />
                <Text style={modal.whenText}>{logDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.whenBtn, { flex: 1 }]} onPress={() => setShowTime(true)}>
                <Ionicons name="time" size={15} color={tabCfg?.color} />
                <Text style={modal.whenText}>{fmt12(logH, logM)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modal.nowBtn} onPress={() => { const n = new Date(); setLogDate(n); setLogH(n.getHours()); setLogM(Math.round(n.getMinutes() / 5) * 5); }}>
                <Text style={[modal.nowText, { color: tabCfg?.color }]}>Now</Text>
              </TouchableOpacity>
            </View>

            {tab === 'feeding' && (
              <>
                <Text style={modal.label}>Type</Text>
                <View style={modal.optRow}>
                  {(['breast', 'bottle', 'solid'] as const).map(t => (
                    <TouchableOpacity key={t} style={[modal.opt, feedType === t && { backgroundColor: tabCfg?.color, borderColor: tabCfg?.color }]}
                      onPress={() => setFeedType(t)}>
                      <Text style={[modal.optText, feedType === t && { color: Colors.white }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={modal.label}>Amount</Text>
                    <TextInput style={modal.input} value={amount} onChangeText={setAmount} placeholder="120 ml" placeholderTextColor={Colors.textLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modal.label}>Duration (min)</Text>
                    <TextInput style={modal.input} value={duration} onChangeText={setDuration} placeholder="15" keyboardType="numeric" placeholderTextColor={Colors.textLight} />
                  </View>
                </View>
              </>
            )}

            {tab === 'diaper' && (
              <>
                <Text style={modal.label}>Type</Text>
                <View style={modal.optRow}>
                  {(['pee', 'poop', 'both'] as const).map(t => (
                    <TouchableOpacity key={t} style={[modal.opt, diaperType === t && { backgroundColor: tabCfg?.color, borderColor: tabCfg?.color }]}
                      onPress={() => setDiaperType(t)}>
                      <Text style={[modal.optText, diaperType === t && { color: Colors.white }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={modal.label}>Consistency</Text>
                <TextInput style={modal.input} value={consistency} onChangeText={setConsistency} placeholder="normal, soft, watery..." placeholderTextColor={Colors.textLight} />
              </>
            )}

            {tab === 'sleep' && (
              <>
                <Text style={modal.label}>Type</Text>
                <View style={modal.optRow}>
                  {(['nap', 'night'] as const).map(t => (
                    <TouchableOpacity key={t} style={[modal.opt, sleepType === t && { backgroundColor: tabCfg?.color, borderColor: tabCfg?.color }]}
                      onPress={() => setSleepType(t)}>
                      <Text style={[modal.optText, sleepType === t && { color: Colors.white }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={modal.label}>Duration (minutes)</Text>
                <TextInput style={modal.input} value={sleepDur} onChangeText={setSleepDur} placeholder="90" keyboardType="numeric" placeholderTextColor={Colors.textLight} />
              </>
            )}

            {tab === 'medicine' && (
              <>
                <Text style={modal.label}>Medicine Name *</Text>
                <TextInput style={modal.input} value={medName} onChangeText={setMedName} placeholder="e.g. Tylenol" placeholderTextColor={Colors.textLight} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={modal.label}>Dosage *</Text>
                    <TextInput style={modal.input} value={dosage} onChangeText={setDosage} placeholder="5 ml" placeholderTextColor={Colors.textLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modal.label}>Frequency</Text>
                    <TextInput style={modal.input} value={frequency} onChangeText={setFrequency} placeholder="every 6h" placeholderTextColor={Colors.textLight} />
                  </View>
                </View>
              </>
            )}

            <Text style={modal.label}>Notes</Text>
            <TextInput style={[modal.input, { height: 66 }]} value={notes} onChangeText={setNotes}
              placeholder="Add notes..." placeholderTextColor={Colors.textLight} multiline />

            <TouchableOpacity
              style={[modal.saveBtn, { backgroundColor: tabCfg?.color }, mut.isPending && { opacity: 0.6 }]}
              onPress={() => mut.mutate()} disabled={mut.isPending}
            >
              <Text style={modal.saveBtnText}>{mut.isPending ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      <DatePickerModal visible={showDate} date={logDate}
        onConfirm={d => { setLogDate(d); setShowDate(false); }} onCancel={() => setShowDate(false)} />
      <TimePickerModal visible={showTime} hour={logH} minute={logM}
        onConfirm={(h, m) => { setLogH(h); setLogM(m); setShowTime(false); }} onCancel={() => setShowTime(false)} />
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 0 },
  handle: { width: 36, height: 4, backgroundColor: Colors.lightGray, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  typeIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 16, marginBottom: 8, letterSpacing: 0.3 },
  whenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.veryLightGray, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.lightGray },
  whenText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  nowBtn: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.veryLightGray, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.lightGray },
  nowText: { fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: Colors.veryLightGray, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.lightGray },
  optRow: { flexDirection: 'row', gap: 8 },
  opt: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.veryLightGray, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.lightGray },
  optText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 22 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingTop: Platform.OS === 'web' ? 67 : 56, paddingHorizontal: 22, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  tabGrid: { flexDirection: 'row', backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: Colors.veryLightGray, gap: 4 },
  tabItemLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

  content: { flex: 1 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  logCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  logIconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  logTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  logDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  logNotes: { fontSize: 12, color: Colors.textLight, marginTop: 3, fontStyle: 'italic' },
  logTime: { fontSize: 12, color: Colors.textLight, textAlign: 'right', maxWidth: 70 },

  nextCard: { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  nextCardLeft: { flex: 1 },
  nextCardLabel: { fontSize: 20, fontWeight: '800', color: Colors.white },
  nextCardTime: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  nextCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  nextCardIcon: { position: 'relative' },
  alertDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, borderWidth: 2, borderColor: Colors.primary },

  schedCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  schedTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  schedNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  activePill: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  activePillText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },

  addSchedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: Colors.secondaryLight, borderStyle: 'dashed' },
  addSchedText: { fontSize: 15, fontWeight: '700', color: Colors.secondary },

  schedForm: { backgroundColor: Colors.white, borderRadius: 22, padding: 20, marginTop: 4 },
  schedFormTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 12, marginBottom: 8 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  formInput: { backgroundColor: Colors.veryLightGray, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.lightGray },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intervalChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.veryLightGray, borderWidth: 1, borderColor: Colors.lightGray },
  intervalChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  intervalChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  intervalChipTextActive: { color: Colors.white },
  formCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.lightGray, alignItems: 'center' },
  formCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  formSaveBtn: { flex: 1.5, paddingVertical: 13, borderRadius: 14, backgroundColor: Colors.secondary, alignItems: 'center' },
  formSaveText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
});
