import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  console.log("Index route mounted - Redirecting to /(tabs)");
  return <Redirect href="/(tabs)" />;
}
