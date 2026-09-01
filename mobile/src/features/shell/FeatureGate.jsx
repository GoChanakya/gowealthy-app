import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Route-level guard for parked flows.
 *
 * Hiding a tab isn't enough: expo-router registers every file under app/ as a
 * route, so without this, `gowealthy://goshares` still opens in a lite build.
 * Drop this at the top of a parked group's _layout and it bounces back to the
 * app shell whenever the feature is off.
 */
export default function FeatureGate({ enabled, children, fallback = '/(gowealthy)/dashboard' }) {
  if (!enabled) return <Redirect href={fallback} />;
  return children;
}
