import React from "react";
import {
  Flame, Shield, Compass, Blocks, Landmark, TrendingUp, Plane, Scale,
  Zap, Snowflake, Handshake, Search, Banknote, Calculator,
  Bird, Gem, Sprout, Activity, ChartBar, Target,
  Rocket, CircleSlash, ClipboardList, Lightbulb, CloudRain, EyeOff,
  Crown, Swords, Megaphone, Moon,
  Users, KeyRound, House, GraduationCap, HeartPulse, Wallet, Circle,
  // GoWiser + app shell
  BookOpen, Trophy, Instagram, Twitter, Linkedin, Youtube,
  CircleCheck, CircleX, X, ChevronLeft, ChevronRight, ArrowUpRight, Play,
  PieChart, Lock, Eye, Clock,
} from "lucide-react-native";
import { C, ICON } from "./ui-kit";

/**
 * Icon registry.
 *
 * Data in goPersonaEngine.js refers to icons by name, not by component, so the
 * engine stays a plain data module with no React imports. Names are listed
 * explicitly here rather than via `import *` so Metro only bundles the ~37
 * icons actually used instead of all ~1500.
 *
 * Everything is lucide outline at a single stroke weight — that consistency is
 * the whole point. Emoji were the previous approach and they can't be tinted,
 * render differently per device, and read as placeholder art.
 */
const REGISTRY = {
  Flame, Shield, Compass, Blocks, Landmark, TrendingUp, Plane, Scale,
  Zap, Snowflake, Handshake, Search, Banknote, Calculator,
  Bird, Gem, Sprout, Activity, ChartBar, Target,
  Rocket, CircleSlash, ClipboardList, Lightbulb, CloudRain, EyeOff,
  Crown, Swords, Megaphone, Moon,
  Users, KeyRound, House, GraduationCap, HeartPulse, Wallet,
  BookOpen, Trophy, Instagram, Twitter, Linkedin, Youtube,
  CircleCheck, CircleX, X, ChevronLeft, ChevronRight, ArrowUpRight, Play,
  PieChart, Lock, Eye, Clock,
};

export function Ico({ name, size = ICON.md, color = C.o2, strokeWidth = ICON.stroke, style }) {
  const Cmp = REGISTRY[name] || Circle;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}

export default Ico;
