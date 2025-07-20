import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Explorar from '../screens/Explorar';
import Social from '../screens/Social';
import Ingressos from '../screens/Ingressos';
import Perfil from '../screens/Perfil';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Explorar':
              iconName = 'compass';
              break;
            case 'Social':
              iconName = 'people';
              break;
            case 'Ingressos':
              iconName = 'ticket';
              break;
            case 'Perfil':
              iconName = 'person';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Explorar" component={Explorar} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}