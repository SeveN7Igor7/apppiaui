import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabs from './BottomTabs';
import VibeScreen from '../screens/VibeScreen';
import EditarPerfil from '../screens/EditarPerfil';
import UploadImageScreen from '../screens/UploadImageScreen';
import Ingressos from '../screens/Ingressos'; // ✅ Importe aqui

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="VibeScreen" component={VibeScreen} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      <Stack.Screen name="UploadImage" component={UploadImageScreen} />
      <Stack.Screen name="Ingressos" component={Ingressos} /> 
    </Stack.Navigator>
  );
}
