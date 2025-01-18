// screens/HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#6C71FF", "#A29BFF"]}
      style={styles.gradientBackground}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Moral Torture Machine</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EvaluationDilemmasScreen')}
        >
          <Text style={styles.buttonText}>Test your morality</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('InfiniteDilemmasScreen')}
        >
          <Text style={styles.buttonText}>Arcade: Infinite Dilemmas</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: "#6C71FF",
    alignItems: "center",
    marginVertical: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
