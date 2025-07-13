import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabs from './BottomTabs';
import VibeScreen from '../screens/VibeScreen';

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* BottomTabs fica como tela principal */}
      <Stack.Screen name="Tabs" component={BottomTabs} />
      {/* Tela fora das abas */}
      <Stack.Screen name="VibeScreen" component={VibeScreen} />
    </Stack.Navigator>
  );
}
