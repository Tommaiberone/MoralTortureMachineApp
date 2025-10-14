// screens/HomeScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useFonts, Poppins_700Bold, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  HorrorColors,
  HorrorGradients,
  HorrorTextStyles,
  HorrorButtonStyles,
  HorrorShadows,
  HorrorAnimations,
  createPulseAnimation,
  createFlickerAnimation,
} from '../styles/horrorTheme';

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
  });

  // Animation values
  const titleFlicker = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(0)).current;
  const backgroundPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title flicker animation (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleFlicker, {
          toValue: 1,
          duration: 3000,
          ...HorrorAnimations.flicker,
        }),
        Animated.timing(titleFlicker, {
          toValue: 0,
          duration: 0,
          ...HorrorAnimations.flicker,
        }),
      ])
    ).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          ...HorrorAnimations.pulse,
        }),
        Animated.timing(buttonPulse, {
          toValue: 0,
          duration: 2000,
          ...HorrorAnimations.pulse,
        }),
      ])
    ).start();

    // Background pulse (slow, subtle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 4000,
          ...HorrorAnimations.slowPulse,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 0,
          duration: 4000,
          ...HorrorAnimations.slowPulse,
        }),
      ])
    ).start();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HorrorColors.bloodRed} />
        <Text style={styles.loadingText}>Awakening the machine...</Text>
      </View>
    );
  }

  const titleAnimation = createFlickerAnimation(titleFlicker);
  const pulseAnimation = createPulseAnimation(buttonPulse);

  return (
    <LinearGradient
      colors={HorrorGradients.toxicGlow}
      style={styles.gradientBackground}
    >
      <Animated.View style={[styles.container, { opacity: backgroundPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
      })}]}>
        <Animated.Text style={[styles.title, titleAnimation]}>
          MORAL{'\n'}TORTURE{'\n'}MACHINE
        </Animated.Text>

        <Text style={styles.subtitle}>Enter if you dare...</Text>

        {/* Recommended Button */}
        <Animated.View style={pulseAnimation}>
          <TouchableOpacity
            style={[styles.button, styles.recommendedButton]}
            onPress={() => navigation.navigate('EvaluationDilemmasScreen')}
          >
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>⚠ WARNING ⚠</Text>
            </View>
            <Text style={styles.buttonText}>🩸 Test Your Morality 🩸</Text>
            <Text style={styles.buttonDescription}>
              Face a series of disturbing moral dilemmas. Your conscience will be judged.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Arcade Button */}
        <TouchableOpacity
          style={[styles.button, styles.arcadeButton]}
          onPress={() => navigation.navigate('InfiniteDilemmasScreen')}
        >
          <Text style={styles.buttonText}>💀 Endless Torment Mode 💀</Text>
          <Text style={styles.buttonDescription}>
            An infinite stream of ethical nightmares. There is no escape.
          </Text>
        </TouchableOpacity>

        <Text style={styles.warningFooter}>
          ⚠ This machine will expose your darkest moral boundaries ⚠
        </Text>
      </Animated.View>
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
    width: width * 0.9,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    color: HorrorColors.crimson,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: HorrorColors.bloodRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 18,
    color: HorrorColors.eerieGreen,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: HorrorColors.shadowGray,
    alignItems: "center",
    marginVertical: 12,
    borderWidth: 2,
    borderColor: HorrorColors.fogGray,
    position: 'relative',
    ...HorrorShadows.deep,
  },
  recommendedButton: {
    backgroundColor: HorrorColors.bloodRed,
    borderColor: HorrorColors.crimson,
    borderWidth: 3,
    ...HorrorShadows.bloodGlow,
  },
  arcadeButton: {
    backgroundColor: HorrorColors.darkPurple,
    borderColor: HorrorColors.eerieGreen,
    borderWidth: 2,
    ...HorrorShadows.glow,
  },
  badgeContainer: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: HorrorColors.warningOrange,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: HorrorColors.dangerRed,
    zIndex: 1,
    ...HorrorShadows.deep,
  },
  badgeText: {
    color: HorrorColors.voidBlack,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
  buttonText: {
    color: HorrorColors.ghostWhite,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: HorrorColors.voidBlack,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonDescription: {
    color: HorrorColors.ashGray,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  warningFooter: {
    color: HorrorColors.warningOrange,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginTop: 30,
    letterSpacing: 1,
    textShadowColor: HorrorColors.darkCrimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HorrorColors.voidBlack,
  },
  loadingText: {
    color: HorrorColors.bloodRed,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 20,
    letterSpacing: 2,
  },
});

export default HomeScreen;
