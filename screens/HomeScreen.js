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
        
        {/* Recommended Button */}
        <TouchableOpacity
          style={[styles.button, styles.recommendedButton]}
          onPress={() => navigation.navigate('EvaluationDilemmasScreen')}
        >
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Recommended</Text>
          </View>
          <Text style={styles.buttonText}>Test your morality</Text>
          <Text style={styles.buttonDescription}>
            Start the morality test and face a series of moral dilemmas to evaluate your moral compass.
          </Text>
        </TouchableOpacity>
        
        {/* Other Buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('InfiniteDilemmasScreen')}
        >
          <Text style={styles.buttonText}>Arcade: Infinite Dilemmas</Text>
          <Text style={styles.buttonDescription}>
            Enter the arcade mode with an infinite stream of moral dilemmas for endless fun and ethical challenges.
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  recommendedButton: {
    backgroundColor: "#FF8C00", // Different color to highlight
    elevation: 10, // Higher elevation for shadow effect
  },
  buttonDescription: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    textAlign: 'center',
    marginTop: 8,
  },
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
    paddingVertical: 20, // Increased padding for better touch area
    borderRadius: 30,
    backgroundColor: "#6C71FF",
    alignItems: "center",
    marginVertical: 10,
    elevation: 5,
    position: 'relative', // To position the badge
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
