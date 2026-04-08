// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './src/context/AppContext';

import HomeScreen  from './src/screens/HomeScreen';
import FilesScreen from './src/screens/FilesScreen';
import VaultScreen from './src/screens/VaultScreen';
import AuthScreen  from './src/screens/AuthScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"  component={HomeScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main"  component={MainTabs} />
          <Stack.Screen name="Files" component={FilesScreen} />
          <Stack.Screen name="Auth"  component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}