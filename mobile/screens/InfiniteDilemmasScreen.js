// DilemmaScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import 'react-native-url-polyfill/auto';

// Import the useFonts hook and the Poppins font
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import {
  HorrorColors,
  HorrorGradients,
  HorrorTextStyles,
  HorrorButtonStyles,
  HorrorShadows,
  HorrorCardStyles,
  HorrorAnimations,
  getCreepyMessage,
  createPulseAnimation,
  createShakeAnimation,
} from '../styles/horrorTheme';

const { width } = Dimensions.get("window");

const DilemmaScreen = ({ navigation }) => { // Renamed from App to DilemmaScreen
  // Existing Hooks
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark horror mode
  const [dilemmaGenerated, setDilemmaGenerated] = useState(false);
  const [answers, setAnswers] = useState({
    firstAnswer: "Yes",
    secondAnswer: "No",
  });
  const [teases, setTeases] = useState({
    teaseOption1: "",
    teaseOption2: "",
  });
  const [selectedTease, setSelectedTease] = useState("");
  const [choiceMade, setChoiceMade] = useState(false);
  const [distribution, setDistribution] = useState([0, 0]);
  const [creepyMessage, setCreepyMessage] = useState("");

  // Animation values
  const cardPulse = useRef(new Animated.Value(0)).current;
  const buttonShake = useRef(new Animated.Value(0)).current;
  const textGlow = useRef(new Animated.Value(0)).current;

  // New Hook added after existing Hooks to maintain order
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Card pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {
          toValue: 1,
          duration: 2500,
          ...HorrorAnimations.pulse,
        }),
        Animated.timing(cardPulse, {
          toValue: 0,
          duration: 2500,
          ...HorrorAnimations.pulse,
        }),
      ])
    ).start();

    // Text glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(textGlow, {
          toValue: 1,
          duration: 2000,
          ...HorrorAnimations.pulse,
        }),
        Animated.timing(textGlow, {
          toValue: 0,
          duration: 2000,
          ...HorrorAnimations.pulse,
        }),
      ])
    ).start();
  }, []);

  // If fonts are not loaded, display a loading indicator
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HorrorColors.bloodRed} />
        <Text style={styles.loadingText}>{getCreepyMessage()}</Text>
      </View>
    );
  }

  const backendUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/generate-dilemma";

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        return content;
      } catch (error) {
        console.error("Error during fetch or parsing:", error);
        retries -= 1;

        if (retries === 0) {
          throw new Error("Max retries reached. Failed to fetch valid data.");
        }
      }
    }
  };

  const fetchDilemma = async () => {
    setLoading(true);
    setCreepyMessage(getCreepyMessage());
    setDilemmaGenerated(false);
    setGeneratedText("");
    setSelectedTease("");
    setChoiceMade(false);
    setDistribution([0, 0]);

    try {
      const content = await fetchDilemmaData();
      setGeneratedText(content.dilemma.trim());
      setAnswers({
        firstAnswer: content.firstAnswer,
        secondAnswer: content.secondAnswer,
      });
      setTeases({
        teaseOption1: content.teaseOption1,
        teaseOption2: content.teaseOption2,
      });
      setDilemmaGenerated(true);
    } catch (error) {
      console.error("Error during backend call:", error);
      setGeneratedText("⚠ The machine has malfunctioned. Your soul remains unjudged... for now.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice) => {
    setSelectedTease(
      choice === "first" ? teases.teaseOption1 : teases.teaseOption2
    );

    const firstRandom = Math.floor(Math.random() * 100);
    const secondRandom = 100 - firstRandom;

    setDistribution(
      choice === "first"
        ? [Math.min(firstRandom + 1, 100), Math.max(secondRandom - 1, 0)]
        : [Math.max(firstRandom - 1, 0), Math.min(secondRandom + 1, 100)]
    );

    setChoiceMade(true);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Define horror color variables
  const colors = {
    background: HorrorColors.voidBlack,
    gradientBackground: HorrorGradients.toxicGlow,
    title: HorrorColors.crimson,
    buttonBackground: HorrorColors.bloodRed,
    generateNewButtonBackground: HorrorColors.darkPurple,
    buttonText: HorrorColors.ghostWhite,
    generatedTextLabel: HorrorColors.eerieGreen,
    generatedTextBackground: HorrorColors.charcoal,
    generatedTextColor: HorrorColors.ghostWhite,
    teaseTextBackground: HorrorColors.bloodRed,
    teaseTextColor: HorrorColors.ghostWhite,
    distributionOptionColor: HorrorColors.ashGray,
    progressBarBackground: HorrorColors.shadowGray,
    firstSegment: HorrorColors.bloodRed,
    secondSegment: HorrorColors.eerieGreen,
    yesButtonBackground: HorrorColors.bloodRed,
    noButtonBackground: HorrorColors.darkPurple,
    toggleText: HorrorColors.ashGray,
    toggleSwitchBackground: HorrorColors.shadowGray,
    toggleSwitchCircle: HorrorColors.eerieGreen,
    goBackButtonBg: HorrorColors.shadowGray,
  };

  const cardAnimation = createPulseAnimation(cardPulse);
  const textAnimation = {
    textShadowRadius: textGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 25],
    }),
  };

  return (
    <LinearGradient
      colors={colors.gradientBackground}
      style={styles.gradientBackground}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Go Back Button */}
        <TouchableOpacity
          style={{ ...styles.goBackButton, backgroundColor: colors.goBackButtonBg }}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Escape back to safety"
        >
          <Ionicons name="arrow-back" size={24} color={HorrorColors.ghostWhite} />
          <Text style={styles.goBackText}>ESCAPE</Text>
        </TouchableOpacity>

        {/* Header with Title */}
        <View style={styles.header}>
          {/* Title */}
          <Animated.Text style={[styles.title, { color: colors.title }]}>
            💀 ENDLESS TORMENT 💀
          </Animated.Text>
          <Text style={[styles.subtitle, { color: colors.generatedTextLabel }]}>
            Your choices have consequences...
          </Text>
        </View>

        {/* Main Content Card */}
        <Animated.View
          style={[
            styles.card,
            cardAnimation,
            {
              backgroundColor: colors.generatedTextBackground,
              shadowColor: HorrorColors.bloodRed,
            },
          ]}
        >
          {!dilemmaGenerated ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={fetchDilemma}
                disabled={loading}
                style={[
                  styles.button,
                  {
                    backgroundColor: loading ? HorrorColors.shadowGray : colors.buttonBackground,
                    borderColor: HorrorColors.crimson,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "⏳ " + creepyMessage : "🩸 SUMMON DILEMMA 🩸"}
                </Text>
              </TouchableOpacity>
              {loading && (
                <>
                  <ActivityIndicator
                    size="large"
                    color={HorrorColors.bloodRed}
                    style={{ marginTop: 15 }}
                  />
                  <Text style={styles.loadingText}>{creepyMessage}</Text>
                </>
              )}
            </View>
          ) : (
            <View>
              <Animated.Text
                style={[
                  styles.generatedTextLabel,
                  { color: colors.generatedTextLabel },
                  textAnimation,
                ]}
              >
                ☠ YOUR MORAL NIGHTMARE ☠
              </Animated.Text>
              <Text
                style={[
                  styles.generatedText,
                  {
                    backgroundColor: colors.generatedTextBackground,
                    color: colors.generatedTextColor,
                  },
                ]}
              >
                {generatedText}
              </Text>

              {!choiceMade ? (
                <View style={styles.responseButtons}>
                  <TouchableOpacity
                    style={[
                      styles.yesButton,
                      {
                        backgroundColor: colors.yesButtonBackground,
                        borderColor: HorrorColors.crimson,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => handleChoice("first")}
                  >
                    <Text style={styles.buttonText}>🩸 {answers.firstAnswer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.noButton,
                      {
                        backgroundColor: colors.noButtonBackground,
                        borderColor: HorrorColors.eerieGreen,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => handleChoice("second")}
                  >
                    <Text style={styles.buttonText}>💀 {answers.secondAnswer}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Animated.Text
                    style={[
                      styles.teaseText,
                      {
                        backgroundColor: colors.teaseTextBackground,
                        color: colors.teaseTextColor,
                        borderColor: HorrorColors.darkCrimson,
                        borderWidth: 2,
                      },
                      textAnimation,
                    ]}
                  >
                    {selectedTease}
                  </Animated.Text>
                  <TouchableOpacity
                    onPress={fetchDilemma}
                    disabled={loading}
                    style={[
                      styles.button,
                      styles.generateNewButton,
                      {
                        backgroundColor: loading
                          ? HorrorColors.shadowGray
                          : colors.generateNewButtonBackground,
                        borderColor: HorrorColors.eerieGreen,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "⏳ " + creepyMessage : "🔁 SUMMON NEXT NIGHTMARE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  /**********************************************
   * Overall Container & Body
   **********************************************/
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  loadingText: {
    color: HorrorColors.eerieGreen,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  /**********************************************
   * Go Back Button Styles
   **********************************************/
  goBackButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    zIndex: 1,
    borderWidth: 2,
    borderColor: HorrorColors.crimson,
    ...HorrorShadows.deep,
  },
  goBackText: {
    color: HorrorColors.ghostWhite,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginLeft: 5,
    letterSpacing: 2,
  },

  /**********************************************
   * Header (title and subtitle)
   **********************************************/
  header: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Poppins_700Bold",
    textShadowColor: HorrorColors.bloodRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
    letterSpacing: 1.5,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  toggleContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /**********************************************
   * Card Layout for Main Content
   **********************************************/
  card: {
    padding: 25,
    borderRadius: 12,
    width: width * 0.9,
    borderWidth: 2,
    borderColor: HorrorColors.bloodRed,
    ...HorrorShadows.ominous,
  },

  /**********************************************
   * Generate Button & Spinner
   **********************************************/
  buttonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...HorrorShadows.bloodGlow,
  },
  buttonText: {
    color: HorrorColors.ghostWhite,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.5,
    textShadowColor: HorrorColors.voidBlack,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  generateNewButton: {
    marginTop: 25,
  },

  /**********************************************
   * The Ethical Dilemma Text Area
   **********************************************/
  generatedTextLabel: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "Poppins_700Bold",
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  generatedText: {
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    fontSize: 17,
    lineHeight: 26,
    elevation: 5,
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: HorrorColors.fogGray,
    ...HorrorShadows.deep,
  },

  /**********************************************
   * Yes/No Buttons
   **********************************************/
  responseButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  yesButton: {
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    ...HorrorShadows.bloodGlow,
  },
  noButton: {
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    ...HorrorShadows.glow,
  },

  /**********************************************
   * The Tease Text (Shown after user chooses)
   **********************************************/
  teaseText: {
    marginTop: 25,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
    ...HorrorShadows.bloodGlow,
  },

  /**********************************************
   * Distribution Bar Styles
   **********************************************/
  distributionBarWrapper: {
    marginTop: 25,
    alignItems: "center",
  },
  distributionOption: {
    marginVertical: 8,
    fontSize: 16,
    fontFamily: "Poppins_400Regular", // Changed to Poppins Regular
  },
  progressBarContainer: {
    width: "100%",
    height: 28,
    marginVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  firstSegment: {
    backgroundColor: "#6C71FF", // Primary Purple
  },
  secondSegment: {
    backgroundColor: "#FFB86C", // Soft Orange
  },

  /**********************************************
   * Toggle Switch (Dark/Light Mode)
   **********************************************/
  toggleSwitch: {
    width: 50,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    padding: 2,
  },

  /**********************************************
   * Loading Indicator Styles
   **********************************************/
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HorrorColors.voidBlack,
  },

  /**********************************************
   * Responsive Adjustments (Optional)
   **********************************************/
  responsiveContainer: {
    paddingHorizontal: 15,
    width: "90%",
  },
  responsiveTitle: {
    fontSize: 28,
  },
  responsiveText: {
    fontSize: 16,
  },
});

export default DilemmaScreen;
