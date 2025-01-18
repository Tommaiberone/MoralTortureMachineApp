// screens/EvaluationDilemmasScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import 'react-native-url-polyfill/auto';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get("window");

const MAX_DILEMMAS = 1;

const EvaluationDilemmasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [distribution, setDistribution] = useState([0, 0]);
  const [currentDilemmaCount, setCurrentDilemmaCount] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  const navigation = useNavigation();

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (currentDilemmaCount >= MAX_DILEMMAS) {
      navigation.navigate('Results', { answers: selectedAnswers });
    }
  }, [currentDilemmaCount]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
      </View>
    );
  }

  const backendUrl = "https://tommaiberone.pythonanywhere.com/get-dilemma";

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        response = await fetch(backendUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Fetched data:", result);
        // Directly return the result as it's already a JSON object
        return result;
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
    setChoiceMade(false);
    setSelectedTease("");
    setDistribution([0, 0]);

    try {
      const fetchedDilemma = await fetchDilemmaData();
      console.log("Fetched dilemma:", fetchedDilemma);
      setDilemma(fetchedDilemma);
    } catch (error) {
      console.error("Error during backend call:", error);
      Alert.alert("Error", "Failed to fetch the dilemma. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice) => {
    if (!dilemma) return;

    const selected = choice === "first" ? dilemma.firstAnswer : dilemma.secondAnswer;
    const tease = choice === "first" ? dilemma.teaseOption1 : dilemma.teaseOption2;

    setSelectedTease(tease);

    const firstRandom = Math.floor(Math.random() * 100);
    const secondRandom = 100 - firstRandom;

    setDistribution(
      choice === "first"
        ? [Math.min(firstRandom + 1, 100), Math.max(secondRandom - 1, 0)]
        : [Math.max(firstRandom - 1, 0), Math.min(secondRandom + 1, 100)]
    );

    // Save selected answer's values directly without parsing
    const answerValues = choice === "first" ? {
      Empathy: dilemma.firstAnswerEmpathy,
      Integrity: dilemma.firstAnswerIntegrity,
      Responsibility: dilemma.firstAnswerResponsibility,
      Justice: dilemma.firstAnswerJustice,
      Altruism: dilemma.firstAnswerAltruism,
      Honesty: dilemma.firstAnswerHonesty,
    } : {
      Empathy: dilemma.secondAnswerEmpathy,
      Integrity: dilemma.secondAnswerIntegrity,
      Responsibility: dilemma.secondAnswerResponsibility,
      Justice: dilemma.secondAnswerJustice,
      Altruism: dilemma.secondAnswerAltruism,
      Honesty: dilemma.secondAnswerHonesty,
    };

    setSelectedAnswers([...selectedAnswers, answerValues]);
    setCurrentDilemmaCount(currentDilemmaCount + 1);
    setChoiceMade(true);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = {
    background: isDarkMode ? "#1E1E2E" : "#F0F4FF",
    gradientBackground: isDarkMode
      ? ["#2C2C3E", "#1E1E2E"]
      : ["#6C71FF", "#A29BFF"],
    title: isDarkMode ? "#E0E0E0" : "#333333",
    buttonBackground: isDarkMode ? "#3A3A5A" : "#6C71FF",
    generateNewButtonBackground: isDarkMode ? "#3A3A5A" : "#FFB86C",
    buttonText: "#FFFFFF",
    generatedTextLabel: isDarkMode ? "#E0E0E0" : "#333333",
    generatedTextBackground: isDarkMode ? "#2C2C3E" : "#FFFFFF",
    generatedTextColor: isDarkMode ? "#CCCCCC" : "#333333",
    teaseTextBackground: isDarkMode ? "#6C71FF" : "#A29BFF",
    teaseTextColor: isDarkMode ? "#FFFFFF" : "#1E1E2E",
    distributionOptionColor: isDarkMode ? "#E0E0E0" : "#333333",
    progressBarBackground: isDarkMode ? "#3A3A5A" : "#A29BFF",
    firstSegment: "#6C71FF",
    secondSegment: "#FFB86C",
    yesButtonBackground: "#6C71FF",
    noButtonBackground: "#FFB86C",
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
              style={{ marginTop: 10, marginLeft: 10 }}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.title }]}>
            Ethical Dilemmas
          </Text>
          <Text style={[styles.subtitle, { color: colors.title }]}>
            {currentDilemmaCount} / {MAX_DILEMMAS}
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
          {!dilemma ? (
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
                  {loading ? "🔄 Loading..." : "✨ Get Dilemma"}
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
                🧠 Retrieved Ethical Dilemma:
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
                {dilemma.dilemma}
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
                    <Text style={styles.buttonText}>{dilemma.firstAnswer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.noButton,
                      { backgroundColor: colors.noButtonBackground },
                    ]}
                    onPress={() => handleChoice("second")}
                  >
                    <Text style={styles.buttonText}>{dilemma.secondAnswer}</Text>
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
                      {dilemma.firstAnswer} - {distribution[0]}%
                    </Text>
                    <Text
                      style={[
                        styles.distributionOption,
                        { color: colors.distributionOptionColor },
                      ]}
                    >
                      {dilemma.secondAnswer} - {distribution[1]}%
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
                  {currentDilemmaCount < MAX_DILEMMAS && (
                    <TouchableOpacity
                      onPress={() => setDilemma(null)}
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
                        {loading ? "🔄 Loading..." : "🔁 Get New Dilemma"}
                      </Text>
                    </TouchableOpacity>
                  )}
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
  },
  header: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Poppins_400Regular",
    marginTop: 5,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
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
    fontFamily: "Poppins_600SemiBold",
  },
  generateNewButton: {
    marginTop: 25,
  },
  generatedTextLabel: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
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
    fontFamily: "Poppins_400Regular",
  },
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
    fontFamily: "Poppins_600SemiBold",
  },
  distributionBarWrapper: {
    marginTop: 25,
    alignItems: "center",
  },
  distributionOption: {
    marginVertical: 8,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
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
    backgroundColor: "#6C71FF",
  },
  secondSegment: {
    backgroundColor: "#FFB86C",
  },
  toggleSwitch: {
    width: 50,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    padding: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

export default EvaluationDilemmasScreen;
