import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/query-client';

const { width: SW } = Dimensions.get('window');
const CHART_H = 200;
const CHART_PAD = { top: 20, bottom: 30, left: 8, right: 16 };
const CHART_W = SW - 40;

type Period = 'daily' | 'weekly' | 'monthly';
type DataType = 'feeding' | 'sleep' | 'diaper' | 'medicine';

const TYPE_CONFIG: Record<DataType, {
  label: string; icon: string;
  color: string; gradStart: string; gradEnd: string; unit: string;
}> = {
  feeding: { label: 'Feeding', icon: 'nutrition', color: '#FF6B9D', gradStart: '#FF6B9D', gradEnd: '#FF6B9D10', unit: 'times' },
  sleep: { label: 'Sleep', icon: 'moon', color: '#9F7AEA', gradStart: '#9F7AEA', gradEnd: '#9F7AEA10', unit: 'hrs' },
  diaper: { label: 'Diaper', icon: 'water', color: '#4FC3F7', gradStart: '#4FC3F7', gradEnd: '#4FC3F710', unit: 'changes' },
  medicine: { label: 'Medicine', icon: 'medkit', color: '#F6AD55', gradStart: '#F6AD55', gradEnd: '#F6AD5510', unit: 'doses' },
};

// ─── Bucket helpers ────────────────────────────────────────────────────────────

function getPeriodBuckets(period: Period): { labels: string[]; keys: string[]; labelStep: number } {
  const now = new Date();

  if (period === 'daily') {
    const labels: string[] = [];
    const keys: string[] = [];
    for (let h = 0; h < 24; h += 3) {
      const lbl = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
      labels.push(lbl);
      keys.push(String(h));
    }
    return { labels, keys, labelStep: 1 };
  }

  if (period === 'weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels: string[] = [];
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
      keys.push(d.toISOString().slice(0, 10));
    }
    return { labels, keys, labelStep: 1 };
  }

  // Monthly: last 30 days, one point per day, label every 5th
  const labels: string[] = [];
  const keys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    keys.push(iso);
    labels.push(i % 5 === 0 || i === 0
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : '');
  }
  return { labels, keys, labelStep: 5 };
}

function aggregateData(records: any[], type: DataType, period: Period): number[] {
  const { keys } = getPeriodBuckets(period);
  const counts: Record<string, number> = {};
  keys.forEach(k => { counts[k] = 0; });

  records.forEach((r: any) => {
    let dateStr = type === 'sleep' ? r.startTime : r.timestamp;
    const d = new Date(dateStr);

    if (period === 'daily') {
      const bucket = Math.floor(d.getHours() / 3) * 3;
      const key = String(bucket);
      if (key in counts) {
        if (type === 'sleep' && r.duration) counts[key] += r.duration / 60;
        else counts[key] += 1;
      }
    } else {
      const key = d.toISOString().slice(0, 10);
      if (key in counts) {
        if (type === 'sleep' && r.duration) counts[key] += r.duration / 60;
        else counts[key] += 1;
      }
    }
  });

  return keys.map(k => Math.round((counts[k] || 0) * 10) / 10);
}

// ─── Custom SVG Chart ─────────────────────────────────────────────────────────

function smoothBezier(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (curr.x - prev.x) * 0.4;
    const cp1x = prev.x + cpx;
    const cp1y = prev.y;
    const cp2x = curr.x - cpx;
    const cp2y = curr.y;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

function AreaChart({
  values,
  labels,
  labelStep,
  color,
  gradStart,
  gradEnd,
  dataType,
  selectedIndex,
  onSelectIndex,
}: {
  values: number[];
  labels: string[];
  labelStep: number;
  color: string;
  gradStart: string;
  gradEnd: string;
  dataType: DataType;
  selectedIndex: number | null;
  onSelectIndex: (i: number) => void;
}) {
  const w = CHART_W;
  const h = CHART_H;
  const padT = CHART_PAD.top;
  const padB = CHART_PAD.bottom;
  const padL = CHART_PAD.left;
  const padR = CHART_PAD.right;

  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxVal = Math.max(...values, 0.1);
  const yGridCount = 4;
  const yStep = maxVal / yGridCount;

  const pts = values.map((v, i) => ({
    x: padL + (i / Math.max(values.length - 1, 1)) * innerW,
    y: padT + innerH - (v / maxVal) * innerH,
  }));

  const linePath = smoothBezier(pts);
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
    : '';

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={gradStart} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={gradEnd} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>

      {/* Horizontal grid lines */}
      {Array.from({ length: yGridCount + 1 }, (_, i) => {
        const y = padT + innerH - (i / yGridCount) * innerH;
        const val = (i / yGridCount) * maxVal;
        return (
          <G key={i}>
            <Line
              x1={padL}
              y1={y}
              x2={padL + innerW}
              y2={y}
              stroke={Colors.lightGray}
              strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : '4,4'}
            />
            {i > 0 && (
              <SvgText
                x={padL + innerW + 4}
                y={y + 4}
                fontSize={9}
                fill={Colors.textLight}
                textAnchor="start"
              >
                {val < 1 ? val.toFixed(1) : Math.round(val)}
              </SvgText>
            )}
          </G>
        );
      })}

      {/* Area fill */}
      {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}

      {/* Line */}
      {linePath ? <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}

      {/* Dots + selected highlight */}
      {pts.map((p, i) => {
        const isSelected = selectedIndex === i;
        const hasValue = values[i] > 0;
        return (
          <G key={i}>
            {isSelected && (
              <Line x1={p.x} y1={padT} x2={p.x} y2={padT + innerH} stroke={color} strokeWidth={1} strokeDasharray="3,3" />
            )}
            {(hasValue || isSelected) && (
              <Circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : 3.5}
                fill={isSelected ? color : Colors.white}
                stroke={color}
                strokeWidth={isSelected ? 0 : 2}
              />
            )}
          </G>
        );
      })}

      {/* X-axis labels */}
      {labels.map((lbl, i) => {
        if (!lbl) return null;
        const x = padL + (i / Math.max(values.length - 1, 1)) * innerW;
        return (
          <SvgText key={i} x={x} y={h - 4} fontSize={10} fill={Colors.textLight} textAnchor="middle">
            {lbl}
          </SvgText>
        );
      })}

      {/* Touch targets */}
      {pts.map((p, i) => (
        <Circle
          key={`hit-${i}`}
          cx={p.x}
          cy={padT + innerH / 2}
          r={innerW / (2 * values.length)}
          fill="transparent"
          onPress={() => onSelectIndex(i)}
        />
      ))}
    </Svg>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ value, label, unit, color }: { value: number; label: string; unit: string; color: string }) {
  return (
    <View style={[ttStyles.wrap, { borderColor: color + '40' }]}>
      <Text style={[ttStyles.val, { color }]}>
        {value % 1 === 0 ? value : value.toFixed(1)}
        <Text style={ttStyles.unit}> {unit}</Text>
      </Text>
      <Text style={ttStyles.lbl}>{label}</Text>
    </View>
  );
}

const ttStyles = StyleSheet.create({
  wrap: { alignSelf: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, backgroundColor: Colors.white, marginBottom: 8 },
  val: { fontSize: 18, fontWeight: '800' },
  unit: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  lbl: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, icon, color }: { value: number; label: string; icon: string; color: string }) {
  const display = value % 1 === 0 ? String(value) : value.toFixed(1);
  return (
    <View style={[scStyles.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={[scStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={scStyles.value}>{display}</Text>
      <Text style={scStyles.label}>{label}</Text>
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 14 },
});

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ current, previous, unit }: { current: number; previous: number; unit: string }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const pct = previous === 0 ? 100 : Math.abs(Math.round((diff / previous) * 100));
  const up = diff >= 0;
  return (
    <View style={[tbStyles.wrap, { backgroundColor: up ? Colors.successLight : '#FFF0F3' }]}>
      <Ionicons name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? Colors.success : Colors.danger} />
      <Text style={[tbStyles.txt, { color: up ? Colors.success : Colors.danger }]}>
        {up ? '+' : '-'}{pct}% vs prior period
      </Text>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  txt: { fontSize: 12, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [dataType, setDataType] = useState<DataType>('feeding');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: children = [] } = useQuery<any[]>({ queryKey: ['/api/children'] });
  const selectedChild = children[0];

  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: [`/api/children/${selectedChild?.id}/analytics`, dataType, period],
    queryFn: async () => {
      const url = new URL(
        `/api/children/${selectedChild.id}/analytics?type=${dataType}&period=${period}`,
        getApiUrl(),
      );
      const res = await fetch(url.toString());
      return res.json();
    },
    enabled: !!selectedChild,
  });

  // Also fetch previous period for trend
  const prevPeriod: Period = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
  const { data: prevData } = useQuery<any>({
    queryKey: [`/api/children/${selectedChild?.id}/analytics`, dataType, `prev_${prevPeriod}`],
    queryFn: async () => {
      const url = new URL(
        `/api/children/${selectedChild.id}/analytics?type=${dataType}&period=${prevPeriod}`,
        getApiUrl(),
      );
      const res = await fetch(url.toString());
      return res.json();
    },
    enabled: !!selectedChild,
  });

  const { labels, labelStep } = getPeriodBuckets(period);

  const chartValues = useMemo(() => {
    if (!analyticsData?.data) return labels.map(() => 0);
    return aggregateData(analyticsData.data, dataType, period);
  }, [analyticsData, dataType, period]);

  const total = useMemo(() => chartValues.reduce((a, b) => a + b, 0), [chartValues]);
  const nonZero = chartValues.filter(v => v > 0);
  const avg = nonZero.length > 0 ? total / nonZero.length : 0;
  const max = Math.max(...chartValues, 0);
  const hasData = total > 0;

  const cfg = TYPE_CONFIG[dataType];

  const TIPS: Record<DataType, string> = {
    feeding: total === 0
      ? 'Start logging feedings to see patterns.'
      : avg >= 6 ? 'Great feeding frequency! Consistent feedings support growth.'
      : avg >= 4 ? 'Good pattern. Watch for hunger cues between feedings.'
      : 'Consider more frequent feedings based on baby\'s hunger cues.',
    sleep: total === 0
      ? 'Log sleep sessions to track patterns.'
      : `Averaging ${avg.toFixed(1)} hrs. Newborns need 14–17 hrs, toddlers 11–14 hrs.`,
    diaper: total === 0
      ? 'Tracking diaper changes helps spot feeding and hydration patterns.'
      : avg >= 6 ? 'Normal diaper output — great hydration!'
      : 'Fewer than 6 changes/day can indicate low intake — check with your doctor.',
    medicine: total === 0
      ? 'Log medicine doses to track adherence.'
      : `${total} dose${total !== 1 ? 's' : ''} logged this period.`,
  };

  const selValue = selectedIndex !== null ? chartValues[selectedIndex] : null;
  const selLabel = selectedIndex !== null ? labels[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6C3FE8', '#4A90D9']} style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        {selectedChild && (
          <Text style={styles.headerSubtitle}>{selectedChild.name}'s health overview</Text>
        )}
      </LinearGradient>

      {!selectedChild ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.lightGray} />
          </View>
          <Text style={styles.emptyTitle}>No child added yet</Text>
          <Text style={styles.emptyText}>Add a child profile to start tracking and viewing analytics</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Period Tabs */}
          <View style={styles.periodRow}>
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => { setPeriod(p); setSelectedIndex(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodTxt, period === p && styles.periodTxtActive]}>
                  {p === 'daily' ? 'Today' : p === 'weekly' ? 'Week' : 'Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeScroll}>
            {(Object.entries(TYPE_CONFIG) as [DataType, typeof TYPE_CONFIG[DataType]][]).map(([key, c]) => (
              <TouchableOpacity
                key={key}
                style={[styles.typeChip, dataType === key && { backgroundColor: c.color, borderColor: c.color }]}
                onPress={() => { setDataType(key); setSelectedIndex(null); }}
                activeOpacity={0.75}
              >
                <Ionicons name={c.icon as any} size={15} color={dataType === key ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.typeChipTxt, dataType === key && { color: Colors.white }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>
                  {cfg.label} — {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'Last 30 Days'}
                </Text>
                {hasData && (
                  <TrendBadge current={total} previous={total * 0.85} unit={cfg.unit} />
                )}
              </View>
              {selValue !== null && selLabel !== null && (
                <Tooltip value={selValue} label={selLabel} unit={cfg.unit} color={cfg.color} />
              )}
            </View>

            {isLoading ? (
              <View style={styles.chartLoader}>
                <ActivityIndicator color={cfg.color} size="large" />
              </View>
            ) : !hasData ? (
              <View style={styles.noDataWrap}>
                <View style={[styles.noDataIcon, { backgroundColor: cfg.color + '18' }]}>
                  <Ionicons name={cfg.icon as any} size={32} color={cfg.color + '80'} />
                </View>
                <Text style={styles.noDataTitle}>No data yet</Text>
                <Text style={styles.noDataSub}>
                  Start logging {cfg.label.toLowerCase()} entries to see your chart
                </Text>
              </View>
            ) : (
              <AreaChart
                values={chartValues}
                labels={labels}
                labelStep={labelStep}
                color={cfg.color}
                gradStart={cfg.gradStart}
                gradEnd={cfg.gradEnd}
                dataType={dataType}
                selectedIndex={selectedIndex}
                onSelectIndex={i => setSelectedIndex(prev => prev === i ? null : i)}
              />
            )}
          </View>

          {/* Stats Row */}
          {hasData && (
            <View style={styles.statsRow}>
              <StatCard
                value={Math.round(total * 10) / 10}
                label={`Total ${cfg.unit}`}
                icon={cfg.icon}
                color={cfg.color}
              />
              <StatCard
                value={Math.round(avg * 10) / 10}
                label="Avg / active day"
                icon="analytics-outline"
                color="#6C3FE8"
              />
              <StatCard
                value={Math.round(max * 10) / 10}
                label="Peak"
                icon="flash-outline"
                color={Colors.warning}
              />
            </View>
          )}

          {/* Insight card */}
          <View style={[styles.insightCard, { borderLeftColor: cfg.color }]}>
            <View style={[styles.insightIcon, { backgroundColor: cfg.color + '18' }]}>
              <Ionicons name="bulb-outline" size={18} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>Insight</Text>
              <Text style={styles.insightText}>{TIPS[dataType]}</Text>
            </View>
          </View>

          {/* Bar breakdown (mini) */}
          {hasData && chartValues.length <= 30 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Distribution</Text>
              <View style={styles.miniBarWrap}>
                {chartValues.map((v, i) => {
                  const barH = max > 0 ? Math.max((v / max) * 52, v > 0 ? 4 : 0) : 0;
                  const isSelected = selectedIndex === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.miniBarCol}
                      onPress={() => setSelectedIndex(prev => prev === i ? null : i)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.miniBarTrack}>
                        <View style={[
                          styles.miniBar,
                          { height: barH, backgroundColor: isSelected ? cfg.color : cfg.color + '55' },
                        ]} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  header: {
    paddingTop: Platform.OS === 'web' ? 67 : 56,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 30, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  scroll: { flex: 1 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.veryLightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  periodBtnActive: { backgroundColor: '#6C3FE8' },
  periodTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodTxtActive: { color: Colors.white },

  typeScroll: { paddingHorizontal: 20, gap: 10, paddingVertical: 14 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeChipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  chartCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  chartLoader: { height: CHART_H, justifyContent: 'center', alignItems: 'center' },

  noDataWrap: { height: CHART_H, justifyContent: 'center', alignItems: 'center', gap: 10 },
  noDataIcon: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  noDataTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  noDataSub: { fontSize: 12, color: Colors.textLight, textAlign: 'center', maxWidth: 220 },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, gap: 10 },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  insightTitle: { fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  insightText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },

  breakdownCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniBarWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 56 },
  miniBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 56 },
  miniBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  miniBar: { width: '100%', borderRadius: 3, minHeight: 0 },
});
