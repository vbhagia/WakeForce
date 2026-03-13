import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../utils/constants';

// ─── SectionHeader ─────────────────────────────────────────────────────────

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      <View style={sh.line} />
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sh.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  title: { fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 2.5, marginRight: 10 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  action: { fontSize: 12, color: COLORS.accent, fontWeight: '600', marginLeft: 10 },
});

// ─── Card ──────────────────────────────────────────────────────────────────

export function Card({ children, style, accent }) {
  return (
    <View style={[
      card.base,
      accent && { borderColor: accent + '40' },
      style,
    ]}>
      {children}
    </View>
  );
}
const card = StyleSheet.create({
  base: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
});

// ─── Pill button ───────────────────────────────────────────────────────────

export function PillButton({ label, onPress, color, outlined, disabled }) {
  const bg = outlined ? 'transparent' : (color || COLORS.accent);
  const border = color || COLORS.accent;
  const textColor = outlined ? (color || COLORS.accent) : COLORS.white;
  return (
    <TouchableOpacity
      style={[pb.btn, { backgroundColor: bg + (outlined ? '' : ''), borderColor: border }, disabled && pb.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[pb.txt, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const pb = StyleSheet.create({
  btn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5, alignSelf: 'flex-start',
  },
  txt: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  disabled: { opacity: 0.4 },
});

// ─── Row option with right slot ────────────────────────────────────────────

export function OptionRow({ label, sub, right, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={or.row} onPress={onPress} activeOpacity={0.7}>
      <View style={or.left}>
        <Text style={or.label}>{label}</Text>
        {sub ? <Text style={or.sub}>{sub}</Text> : null}
      </View>
      {right}
    </Wrapper>
  );
}
const or = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  left: { flex: 1, marginRight: SPACING.md },
  label: { fontSize: 15, color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
});

// ─── Loading spinner ───────────────────────────────────────────────────────

export function Loader() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.accent} />
    </View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={em.container}>
      <Text style={em.icon}>{icon}</Text>
      <Text style={em.title}>{title}</Text>
      {subtitle ? <Text style={em.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
const em = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 80, paddingHorizontal: SPACING.xl },
  icon: { fontSize: 52, marginBottom: SPACING.md },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});

// ─── Divider ───────────────────────────────────────────────────────────────

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }, style]} />;
}

// ─── Badge ─────────────────────────────────────────────────────────────────

export function Badge({ label, color }) {
  return (
    <View style={[bg.base, color && { borderColor: color + '50', backgroundColor: color + '15' }]}>
      <Text style={[bg.txt, color && { color }]}>{label}</Text>
    </View>
  );
}
const bg = StyleSheet.create({
  base: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated, alignSelf: 'flex-start',
  },
  txt: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
});
