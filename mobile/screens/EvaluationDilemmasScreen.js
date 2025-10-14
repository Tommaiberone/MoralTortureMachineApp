// screens/EvaluationDilemmasScreen.js
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
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import "react-native-url-polyfill/auto";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useNavigation } from "@react-navigation/native";
import { PieChart } from "react-native-gifted-charts";
import {
  HorrorColors,
  HorrorGradients,
  HorrorShadows,
  getCreepyMessage,
  createPulseAnimation,
} from '../styles/horrorTheme';

const { width } = Dimensions.get("window");

const MAX_DILEMMAS = 5;

const EvaluationDilemmasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [currentDilemmaCount, setCurrentDilemmaCount] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [creepyMessage, setCreepyMessage] = useState("");

  // State to track choices
  const [currentChoice, setChoiceCounts] = useState({ first: 0, second: 0 });

  // New state to manage voting process
  const [voting, setVoting] = useState(false);

  const navigation = useNavigation();

  const [evaluationComplete, setEvaluationComplete] = useState(false);

  // Animation values
  const cardPulse = useRef(new Animated.Value(0)).current;
  const progressGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentDilemmaCount >= MAX_DILEMMAS) {
      setEvaluationComplete(true);
    }
  }, [currentDilemmaCount]);

  useEffect(() => {
    // Card pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(cardPulse, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(progressGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HorrorColors.bloodRed} />
        <Text style={styles.loadingText}>{getCreepyMessage()}</Text>
      </View>
    );
  }

  const backendUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/get-dilemma";
  const voteUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/vote"; // Added voteUrl

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        response = await fetch(backendUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        console.log("Response", response);

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
    setCreepyMessage(getCreepyMessage());
    setDilemma(null);
    setChoiceMade(false);
    setSelectedTease("");
    // Reset choice counts when fetching a new dilemma
    setChoiceCounts({ first: 0, second: 0 });

    try {
      const fetchedDilemma = await fetchDilemmaData();

      console.log("Fetched dilemma:", fetchedDilemma);

      setDilemma(fetchedDilemma);
    } catch (error) {
      console.error("Error during backend call:", error);
      Alert.alert("⚠ ERROR ⚠", "The machine has failed to extract your dilemma. Try again... if you dare.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice) => {
    if (!dilemma || voting) return;

    setVoting(true); // Start voting process

    const selected =
      choice === "first" ? dilemma.firstAnswer : dilemma.secondAnswer;
    const tease =
      choice === "first" ? dilemma.teaseOption1 : dilemma.teaseOption2;

    setSelectedTease(tease);

    // Determine the vote type based on the choice
    const voteType = choice === "first" ? "yes" : "no";

    // Prepare the vote payload
    const votePayload = {
      _id: dilemma._id,
      vote: voteType,
    };

    try {
      // Send the vote to the backend
      const response = await fetch(voteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(votePayload),
      });

      if (!response.ok) {
        throw new Error(`Vote failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Vote response:", result);

      // Optionally, you can update the dilemma's yesCount or noCount based on the vote
      setDilemma((prevDilemma) => ({
        ...prevDilemma,
        yesCount:
          voteType === "yes" ? prevDilemma.yesCount + 1 : prevDilemma.yesCount,
        noCount:
          voteType === "no" ? prevDilemma.noCount + 1 : prevDilemma.noCount,
      }));
    } catch (error) {
      console.error("Error during voting:", error);
      Alert.alert(
        "Voting Error",
        "Failed to record your vote. Please try again."
      );
      setVoting(false); // End voting process
      return; // Exit the function to prevent further state updates
    }

    // Increment the choice count locally
    setChoiceCounts((prevCounts) => ({
      ...prevCounts,
      [choice]: prevCounts[choice] + 1,
    }));

    // Save selected answer's values directly without parsing
    const answerValues =
      choice === "first"
        ? {
            Empathy: dilemma.firstAnswerEmpathy,
            Integrity: dilemma.firstAnswerIntegrity,
            Responsibility: dilemma.firstAnswerResponsibility,
            Justice: dilemma.firstAnswerJustice,
            Altruism: dilemma.firstAnswerAltruism,
            Honesty: dilemma.firstAnswerHonesty,
          }
        : {
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

    setVoting(false); // End voting process
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = {
    background: HorrorColors.voidBlack,
    gradientBackground: HorrorGradients.crimsonNight,
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
  };

  // Prepare data for the PieChart
  const pieChartData = [
    {
      currentChoice: currentChoice.first,
      label: dilemma ? dilemma.firstAnswer : "Option 1",
      color: "#6C71FF",
      previousChoices: dilemma ? dilemma.yesCount : 0,
      // Optional: Add a custom label or other properties
    },
    {
      currentChoice: currentChoice.second,
      label: dilemma ? dilemma.secondAnswer : "Option 2",
      color: "#FFB86C",
      previousChoices: dilemma ? dilemma.noCount : 0,
      // Optional: Add a custom label or other properties
    },
  ];

  // Calculate total choices to handle percentage display
  const totalChoices =
    (pieChartData[0].previousChoices || 0) +
    (pieChartData[1].previousChoices || 0) +
    currentChoice.first +
    currentChoice.second;

    console.log("totalChoices", totalChoices);

  // log everything
  // console.log("pieChartData", pieChartData);
  // console.log("selectedAnswers", selectedAnswers);
  // console.log("selectedTease", selectedTease);

  // console.log("totalChoices", totalChoices);

  // Add percentage to each slice
  const pieChartDataWithPercent = pieChartData.map((item) => (
    {
    ...item,
    percentage:
      totalChoices > 0
        ? (
            ((item.currentChoice + item.previousChoices) / totalChoices) *
            100
          ).toFixed(1)
        : "0.0",
    value: item.currentChoice + item.previousChoices,
  }));

  console.log("pieChartDataWithPercent", pieChartDataWithPercent);

  const cardAnimation = createPulseAnimation(cardPulse);
  const progressAnimation = {
    opacity: progressGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1],
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
          style={{
            ...styles.goBackButton,
            backgroundColor: HorrorColors.shadowGray,
            borderColor: HorrorColors.bloodRed,
            borderWidth: 2,
          }}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Escape the evaluation"
        >
          <Ionicons name="arrow-back" size={24} color={HorrorColors.ghostWhite} />
          <Text style={styles.goBackText}>ESCAPE</Text>
        </TouchableOpacity>

        {/* Header with Title */}
        <View style={styles.header}>
          {/* Title */}
          <Animated.Text style={[styles.title, { color: colors.title }, progressAnimation]}>
            🩸 MORALITY TEST 🩸
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { color: colors.generatedTextLabel }, progressAnimation]}>
            Victim {currentDilemmaCount} of {MAX_DILEMMAS}
          </Animated.Text>
          <Text style={[styles.warningText, { color: HorrorColors.warningOrange }]}>
            ⚠ Your soul is being evaluated ⚠
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
              borderColor: HorrorColors.crimson,
              borderWidth: 2,
            },
          ]}
        >
          {!dilemma ? (
            <View style={styles.buttonContainer}>
              {/* Initial "Get Dilemma" Button */}
              <TouchableOpacity
                onPress={fetchDilemma}
                disabled={loading}
                style={[
                  styles.button,
                  {
                    backgroundColor: loading
                      ? HorrorColors.shadowGray
                      : colors.buttonBackground,
                    borderColor: HorrorColors.crimson,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "⏳ " + creepyMessage : "🩸 RECEIVE JUDGMENT 🩸"}
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
                  progressAnimation,
                ]}
              >
                ☠ YOUR MORAL TORMENT ☠
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
                {dilemma.dilemma}
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
                    disabled={voting}
                  >
                    <Text style={styles.buttonText}>🩸 {dilemma.firstAnswer}</Text>
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
                    disabled={voting}
                  >
                    <Text style={styles.buttonText}>
                      💀 {dilemma.secondAnswer}
                    </Text>
                  </TouchableOpacity>
                  {voting && (
                    <ActivityIndicator
                      size="small"
                      color={HorrorColors.bloodRed}
                      style={{ marginTop: 10 }}
                    />
                  )}
                </View>
              ) : (
                <View>
                  {/* Existing code for displaying the tease text and PieChart */}
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
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={pieChartDataWithPercent}
                      donut={true}
                      donutWidth={40}
                      radius={width * 0.25}
                      innerRadius={50}
                      showText
                      textSize={14}
                      textColor={colors.title}
                      centerLabelComponent={() => (
                        <Text
                          style={{
                            fontSize: 16,
                            color: colors.title,
                            fontFamily: "Poppins_600SemiBold",
                          }}
                        >
                          Choices
                        </Text>
                      )}
                    />
                    <View style={styles.pieChartLegend}>
                      {pieChartDataWithPercent.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.legendLabel,
                              { color: colors.title },
                            ]}
                          >
                            {item.label}: {item.value} ({item.percentage}%)
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {evaluationComplete ? (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("Results", {
                          answers: selectedAnswers,
                        })
                      }
                      style={[
                        styles.button,
                        styles.generateNewButton,
                        {
                          backgroundColor: colors.generateNewButtonBackground,
                          borderColor: HorrorColors.eerieGreen,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Text style={styles.buttonText}>💀 SEE YOUR JUDGMENT 💀</Text>
                    </TouchableOpacity>
                  ) : (
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
                        {loading ? "⏳ " + creepyMessage : "🔁 NEXT TORMENT"}
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
    verticalAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  header: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    verticalAlign: "center",
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
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  toggleContainer: {
    marginTop:10,
    flexDirection: "row",
    alignItems: "center",
    verticalAlign: "center",
    justifyContent: "center",
  },
  card: {
    padding: 25,
    borderRadius: 12,
    width: width * 0.9,
    ...HorrorShadows.ominous,
  },
  buttonContainer: {
    alignItems: "center",
    verticalAlign: "center",
    marginVertical: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    verticalAlign: "center",
    justifyContent: "center",
    ...HorrorShadows.bloodGlow,
  },
  buttonText: {
    color: HorrorColors.ghostWhite,
    fontSize: 18,
    fontWeight: "700",
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
    verticalAlign: "center",
    ...HorrorShadows.bloodGlow,
  },
  noButton: {
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    verticalAlign: "center",
    ...HorrorShadows.glow,
  },
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
    borderWidth: 2,
    borderColor: HorrorColors.darkCrimson,
    ...HorrorShadows.bloodGlow,
  },
  distributionBarWrapper: {
    marginTop: 25,
    alignItems: "center",
    verticalAlign: "center",
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
    justifyContent: "center",
    alignItems: "center",
    verticalAlign: "center",
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

  /**********************************************
   * Go Back Button (Additional Styles)
   **********************************************/
  goBackButton: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    verticalAlign: "center",
    padding: 12,
    borderRadius: 8,
    zIndex: 1,
    ...HorrorShadows.deep,
  },
  goBackText: {
    color: HorrorColors.ghostWhite,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginLeft: 5,
    letterSpacing: 2,
  },
  chartContainer: {
    marginTop: 25,
    alignItems: "center",
    verticalAlign: "center",
  },
  pieChartLegend: {
    marginTop: 20,
    width: width * 0.6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
});

export default EvaluationDilemmasScreen;
