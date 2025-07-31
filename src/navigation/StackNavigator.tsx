import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabs from './BottomTabs';
import VibeScreen from '../screens/VibeScreen';
import EventDetails from '../screens/EventDetails';
import EditarPerfil from '../screens/EditarPerfil';
import UploadImageScreen from '../screens/UploadImageScreen';
import Ingressos from '../screens/Ingressos';
import Social from '../screens/Social';
import Configuracoes from '../screens/Configuracoes';

const Stack = createStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="VibeScreen" component={VibeScreen} />
      <Stack.Screen name="EventDetails" component={EventDetails} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      <Stack.Screen name="UploadImage" component={UploadImageScreen} />
      <Stack.Screen name="Ingressos" component={Ingressos} />
      <Stack.Screen name="Social" component={Social} />
      <Stack.Screen name="Configuracoes" component={Configuracoes} />
    </Stack.Navigator>
  );
}
