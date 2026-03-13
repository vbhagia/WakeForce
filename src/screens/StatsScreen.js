import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, MATH_DIFFICULTY, OPTIMAL_SOLVE_TIME } from '../utils/constants';
import { getStats } from '../store/alarmStore';
import { formatSolveTime } from '../utils/mathChallenge';

function StatCard({ label, value, sub, color }) {
  return (
    <View style={[styles.statCard, color && { borderColor: color + '40' }]}>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function DifficultyMeter({ current }) {
  const levels = ['easy', 'medium', 'hard', 'brutal'];
  const colors = [COLORS.green, COLORS.yellow, COLORS.accent, '#ff0040'];
  const idx = levels.indexOf(current);

  return (
    <View style={styles.meterContainer}>
      <Text style={styles.meterLabel}>CURRENT DIFFICULTY</Text>
      <View style={styles.meter}>
        {levels.map((l, i) => (
          <View
            key={l}
            style={[
              styles.meterSegment,
              { backgroundColor: i <= idx ? colors[i] : COLORS.bgElevated },
              i === idx && styles.meterSegmentActive,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.meterCurrent, { color: colors[idx] }]}>
        {MATH_DIFFICULTY[current]?.label || 'Medium'}
      </Text>
      <Text style={styles.meterHint}>
        Solve faster to level up. Struggle = easier. Target: ~60s
      </Text>
    </View>
  );
}

function SessionRow({ session, idx }) {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const good = session.solveTime <= OPTIMAL_SOLVE_TIME * 1000;
  const icons = { math: '🧮', photo: '📸', both: '💀' };

  return (
    <View style={styles.sessionRow}>
      <Text style={styles.sessionIdx}>#{idx + 1}</Text>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionDate}>{dateStr} · {timeStr}</Text>
        <Text style={styles.sessionMeta}>
          {icons[session.challenge]} {session.difficulty} · {formatSolveTime(session.solveTime)}
        </Text>
      </View>
      <View style={[styles.sessionBadge, { backgroundColor: good ? COLORS.greenGlow : COLORS.accentGlow }]}>
        <Text style={[styles.sessionBadgeTxt, { color: good ? COLORS.green : COLORS.accent }]}>
          {good ? '✓' : '↓'}
        </Text>
      </View>
    </View>
  );
}

export default function StatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);

  useFocusEffect(useCallback(() => {
    getStats().then(setStats);
  }, []));

  if (!stats) return <View style={styles.container} />;

  const avgSec = stats.avgSolveTime ? Math.round(stats.avgSolveTime / 1000) : null;
  const fastestSec = stats.fastestSolve ? Math.round(stats.fastestSolve / 1000) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STATS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <DifficultyMeter current={stats.currentDifficulty} />

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Alarms"
            value={stats.totalAlarms}
            color={COLORS.cyan}
          />
          <StatCard
            label="Avg Solve"
            value={avgSec ? `${avgSec}s` : '—'}
            sub={avgSec ? (avgSec < 60 ? '⚡ Fast' : avgSec > 90 ? '😴 Slow' : '✓ Good') : null}
            color={avgSec
              ? avgSec < 60 ? COLORS.green : avgSec > 90 ? COLORS.accent : COLORS.yellow
              : COLORS.textDim
            }
          />
          <StatCard
            label="Fastest"
            value={fastestSec ? `${fastestSec}s` : '—'}
            color={COLORS.green}
          />
          <StatCard
            label="Target"
            value="60s"
            sub="optimal wake zone"
            color={COLORS.textDim}
          />
        </View>

        {/* Solve time chart (bar chart) */}
        {stats.solveSessions.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>RECENT SOLVE TIMES</Text>
            <View style={styles.chart}>
              {stats.solveSessions.slice(0, 14).reverse().map((s, i) => {
                const sec = s.solveTime / 1000;
                const maxSec = 120;
                const h = Math.min((sec / maxSec) * 100, 100);
                const good = sec <= OPTIMAL_SOLVE_TIME;
                return (
                  <View key={i} style={styles.chartBarWrapper}>
                    <View style={[
                      styles.chartBar,
                      { height: `${h}%`, backgroundColor: good ? COLORS.green : COLORS.accent }
                    ]} />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
                <Text style={styles.legendTxt}>≤60s (optimal)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.legendTxt}>&gt;60s</Text>
              </View>
            </View>
          </View>
        )}

        {/* Session history */}
        {stats.solveSessions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>HISTORY</Text>
            {stats.solveSessions.slice(0, 20).map((s, i) => (
              <SessionRow key={i} session={s} idx={i} />
            ))}
          </View>
        )}

        {stats.solveSessions.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Dismiss some alarms to see your stats</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { fontSize: 24, color: COLORS.textSecondary, width: 40 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 4 },

  scroll: { flex: 1, padding: SPACING.md },

  meterContainer: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  meterLabel: {
    fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 3, marginBottom: SPACING.sm,
  },
  meter: { flexDirection: 'row', gap: 4, marginBottom: SPACING.sm },
  meterSegment: { flex: 1, height: 8, borderRadius: 4 },
  meterSegmentActive: { transform: [{ scaleY: 1.3 }] },
  meterCurrent: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  meterHint: { fontSize: 12, color: COLORS.textDim, lineHeight: 18 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '200', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, textAlign: 'center' },
  statSub: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },

  chartSection: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 3, marginBottom: SPACING.md,
  },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', height: 80,
    gap: 3, marginBottom: SPACING.sm,
  },
  chartBarWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { borderRadius: 2, minHeight: 4 },
  chartLegend: { flexDirection: 'row', gap: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, color: COLORS.textSecondary },

  historySection: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border + '60',
  },
  sessionIdx: { fontSize: 12, color: COLORS.textDim, width: 28 },
  sessionInfo: { flex: 1 },
  sessionDate: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  sessionMeta: { fontSize: 11, color: COLORS.textSecondary },
  sessionBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sessionBadgeTxt: { fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
});
