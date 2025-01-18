// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import InfiniteDilemmasScreen from './screens/InfiniteDilemmasScreen';
import EvaluationDilemmasScreen from './screens/EvaluationDilemmasScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Home Screen */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        {/* Existing Generate Dilemma Screen */}
        <Stack.Screen 
          name="InfiniteDilemmasScreen" 
          component={InfiniteDilemmasScreen} 
          options={{ headerShown: false }} 
        />
        {/* New Get Dilemma Screen */}
        <Stack.Screen 
          name="EvaluationDilemmasScreen" 
          component={EvaluationDilemmasScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
