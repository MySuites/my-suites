import { Redirect } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

export default function Index() {
  console.log("Index route mounted - Redirecting to /(tabs)");
  return <Redirect href="/(tabs)" />;
}
