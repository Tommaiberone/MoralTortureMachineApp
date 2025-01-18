// DilemmaScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import 'react-native-url-polyfill/auto';

// Import the useFonts hook and the Poppins font
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get("window");

const DilemmaScreen = ({ navigation }) => { // Renamed from App to DilemmaScreen
  // Existing Hooks
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
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

  // New Hook added after existing Hooks to maintain order
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // If fonts are not loaded, display a loading indicator
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
      </View>
    );
  }

  const backendUrl = "https://tommaiberone.pythonanywhere.com/generate-dilemma";

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
      setGeneratedText("Failed to fetch the generated text. Try again.");
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

  // Define color variables based on mode
  const colors = {
    background: isDarkMode ? "#1E1E2E" : "#F0F4FF", // Deep Indigo / Very Light Blue
    gradientBackground: isDarkMode
      ? ["#2C2C3E", "#1E1E2E"] // Dark Gradient
      : ["#6C71FF", "#A29BFF"], // Primary to Secondary Purple
    title: isDarkMode ? "#E0E0E0" : "#333333", // Light Gray / Dark Gray
    buttonBackground: isDarkMode ? "#3A3A5A" : "#6C71FF", // Darker Purple / Primary Purple
    generateNewButtonBackground: isDarkMode ? "#3A3A5A" : "#FFB86C", // Darker Purple / Soft Orange
    buttonText: "#FFFFFF", // Always white for contrast
    generatedTextLabel: isDarkMode ? "#E0E0E0" : "#333333",
    generatedTextBackground: isDarkMode ? "#2C2C3E" : "#FFFFFF", // Dark Card / White Card
    generatedTextColor: isDarkMode ? "#CCCCCC" : "#333333",
    teaseTextBackground: isDarkMode ? "#6C71FF" : "#A29BFF", // Primary Purple / Light Purple
    teaseTextColor: isDarkMode ? "#FFFFFF" : "#1E1E2E", // White / Dark Indigo
    distributionOptionColor: isDarkMode ? "#E0E0E0" : "#333333",
    progressBarBackground: isDarkMode ? "#3A3A5A" : "#A29BFF",
    firstSegment: "#6C71FF", // Primary Purple
    secondSegment: "#FFB86C", // Soft Orange
    yesButtonBackground: isDarkMode ? "#6C71FF" : "#6C71FF", // Consistent Primary Purple
    noButtonBackground: isDarkMode ? "#FFB86C" : "#FFB86C", // Consistent Soft Orange
    toggleText: isDarkMode ? "#E0E0E0" : "#333333",
    toggleSwitchBackground: isDarkMode ? "#3A3A5A" : "#A29BFF",
    toggleSwitchCircle: isDarkMode ? "#6C71FF" : "#FFFFFF",
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
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back to the previous screen"
        >
          <Ionicons name="arrow-back" size={24} color="#E0E0E0" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>

        {/* Header with Toggle (Slider) above the Title */}
        <View style={styles.header}>
          {/* Toggle Container */}
          <View style={styles.toggleContainer}>
            <Ionicons
              name={isDarkMode ? "moon" : "sunny"}
              size={24}
              color={colors.toggleText}
            />
            <Switch
              trackColor={{
                false: colors.toggleSwitchBackground,
                true: colors.toggleSwitchBackground,
              }}
              thumbColor={isDarkMode ? colors.toggleSwitchCircle : "#FFFFFF"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleDarkMode}
              value={isDarkMode}
              style={{ marginTop: 10, marginLeft: 10 }} // Adjusted margin for spacing
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.title }]}>
            Moral Torture Machine
          </Text>
        </View>

        {/* Main Content Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.generatedTextBackground,
              shadowColor: isDarkMode ? "#000" : "#000",
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
                  { backgroundColor: loading ? "#CCCCCC" : colors.buttonBackground },
                ]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "🔄 Loading..." : "✨ Generate Dilemma"}
                </Text>
              </TouchableOpacity>
              {loading && (
                <ActivityIndicator
                  size="large"
                  color={colors.buttonText}
                  style={{ marginTop: 15 }}
                />
              )}
            </View>
          ) : (
            <View>
              <Text
                style={[
                  styles.generatedTextLabel,
                  { color: colors.generatedTextLabel },
                ]}
              >
                🧠 Generated Ethical Dilemma:
              </Text>
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
                      { backgroundColor: colors.yesButtonBackground },
                    ]}
                    onPress={() => handleChoice("first")}
                  >
                    <Text style={styles.buttonText}>{answers.firstAnswer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.noButton,
                      { backgroundColor: colors.noButtonBackground },
                    ]}
                    onPress={() => handleChoice("second")}
                  >
                    <Text style={styles.buttonText}>{answers.secondAnswer}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text
                    style={[
                      styles.teaseText,
                      {
                        backgroundColor: colors.teaseTextBackground,
                        color: colors.teaseTextColor,
                      },
                    ]}
                  >
                    {selectedTease}
                  </Text>
                  <View style={styles.distributionBarWrapper}>
                    <Text
                      style={[
                        styles.distributionOption,
                        { color: colors.distributionOptionColor },
                      ]}
                    >
                      {answers.firstAnswer} - {distribution[0]}%
                    </Text>
                    <Text
                      style={[
                        styles.distributionOption,
                        { color: colors.distributionOptionColor },
                      ]}
                    >
                      {answers.secondAnswer} - {distribution[1]}%
                    </Text>
                    <View
                      style={[
                        styles.progressBarContainer,
                        { backgroundColor: colors.progressBarBackground },
                      ]}
                    >
                      <View
                        style={[
                          styles.firstSegment,
                          { flex: distribution[0] / 100 },
                        ]}
                      />
                      <View
                        style={[
                          styles.secondSegment,
                          { flex: distribution[1] / 100 },
                        ]}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={fetchDilemma}
                    disabled={loading}
                    style={[
                      styles.button,
                      styles.generateNewButton,
                      {
                        backgroundColor: loading
                          ? "#CCCCCC"
                          : colors.generateNewButtonBackground,
                      },
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "🔄 Loading..." : "🔁 Generate New Dilemma"}
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
    position: 'relative', // To ensure absolute positioning of the button works correctly
  },

  /**********************************************
   * Go Back Button Styles
   **********************************************/
  goBackButton: {
    position: 'absolute', // Position the button at the top-left corner
    top: 40, // Adjust based on your layout (e.g., status bar height)
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 113, 255, 0.2)', // Semi-transparent background
    padding: 10,
    borderRadius: 8,
    zIndex: 1, // Ensure the button appears above other elements
  },
  goBackText: {
    color: "#E0E0E0",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 5, // Space between icon and text
  },

  /**********************************************
   * Header (toggle and title)
   **********************************************/
  header: {
    width: "100%",
    flexDirection: "column", // Changed from 'row' to 'column'
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Poppins_700Bold", // Changed to Poppins Bold
    marginTop: 10, // Added margin for spacing
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /**********************************************
   * Card Layout for Main Content
   **********************************************/
  card: {
    padding: 25,
    borderRadius: 20,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold", // Changed to Poppins SemiBold
  },
  generateNewButton: {
    marginTop: 25,
  },

  /**********************************************
   * The Ethical Dilemma Text Area
   **********************************************/
  generatedTextLabel: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold", // Changed to Poppins SemiBold
  },
  generatedText: {
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    fontSize: 18,
    lineHeight: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    fontFamily: "Poppins_400Regular", // Changed to Poppins Regular
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
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    alignItems: "center",
  },
  noButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    alignItems: "center",
  },

  /**********************************************
   * The Tease Text (Shown after user chooses)
   **********************************************/
  teaseText: {
    marginTop: 25,
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 15,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    fontFamily: "Poppins_600SemiBold", // Changed to Poppins SemiBold
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
  },

  /**********************************************
   * Go Back Button (Additional Styles)
   **********************************************/
  goBackButton: {
    position: 'absolute', // Position the button at the top-left corner
    top: 40, // Adjust based on your layout (e.g., status bar height)
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 113, 255, 0.2)', // Semi-transparent background
    padding: 10,
    borderRadius: 8,
    zIndex: 1, // Ensure the button appears above other elements
  },
  goBackText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 5, // Space between icon and text
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
