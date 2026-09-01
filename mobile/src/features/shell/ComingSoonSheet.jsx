import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { C, FONT, RADIUS } from '../../lib/ui-kit';

/**
 * Bottom sheet for features that aren't shipping in this build (Mutual Funds).
 * Deliberately plain — it should read as "not yet", not as a broken screen.
 */
export default function ComingSoonSheet({
  visible,
  onClose,
  icon = '◈',
  title = 'Mutual Funds',
  message = "We're putting the finishing touches on direct mutual fund investing. It'll land in an upcoming release.",
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />

          <View style={styles.iconRing}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          <Text style={styles.eyebrow}>Coming soon</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,6,10,0.75)', justifyContent: 'flex-end' },

  sheet: {
    backgroundColor: C.bg2,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.line2,
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 42,
    alignItems: 'center',
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.faint,
    marginBottom: 22,
  },

  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  icon: { fontSize: 24, color: C.o2 },

  eyebrow: {
    color: C.o2,
    fontSize: 10.5,
    fontFamily: FONT.bodySemi,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  message: {
    fontSize: 13.5,
    fontFamily: FONT.body,
    color: C.muted,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 26,
  },

  btn: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line2,
  },
  btnText: { color: C.ink, fontSize: 15, fontFamily: FONT.bodySemi },
});
