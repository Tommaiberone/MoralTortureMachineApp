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
import "react-native-url-polyfill/auto";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useNavigation } from "@react-navigation/native";
import { PieChart } from "react-native-gifted-charts"; // Import PieChart

const { width } = Dimensions.get("window");

const MAX_DILEMMAS = 5;

const EvaluationDilemmasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [currentDilemmaCount, setCurrentDilemmaCount] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  // State to track choices
  const [currentChoice, setChoiceCounts] = useState({ first: 0, second: 0 });

  // New state to manage voting process
  const [voting, setVoting] = useState(false);

  const navigation = useNavigation();

  const [evaluationComplete, setEvaluationComplete] = useState(false);

  useEffect(() => {
    if (currentDilemmaCount >= MAX_DILEMMAS) {
      setEvaluationComplete(true);
    }
  }, [currentDilemmaCount]);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
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
      Alert.alert("Error", "Failed to fetch the dilemma. Please try again.");
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
            backgroundColor: colors.teaseTextBackground,
          }}
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
              style={{ marginTop: 0, marginLeft: 10 }}
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
              {/* Initial "Get Dilemma" Button */}
              <TouchableOpacity
                onPress={fetchDilemma} // Directly fetch a new dilemma
                disabled={loading}
                style={[
                  styles.button,
                  {
                    backgroundColor: loading
                      ? "#CCCCCC"
                      : colors.buttonBackground,
                  },
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
                    disabled={voting} // Disable during voting
                  >
                    <Text style={styles.buttonText}>{dilemma.firstAnswer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.noButton,
                      { backgroundColor: colors.noButtonBackground },
                    ]}
                    onPress={() => handleChoice("second")}
                    disabled={voting} // Disable during voting
                  >
                    <Text style={styles.buttonText}>
                      {dilemma.secondAnswer}
                    </Text>
                  </TouchableOpacity>
                  {voting && (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
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
                        { backgroundColor: colors.generateNewButtonBackground },
                      ]}
                    >
                      <Text style={styles.buttonText}>View Results</Text>
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
    verticalAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    verticalAlign: "center",
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
    marginTop:10,
    flexDirection: "row",
    alignItems: "center",
    verticalAlign: "center",
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
    verticalAlign: "center",
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
    verticalAlign: "center",
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
    verticalAlign: "center",
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
    verticalAlign: "center",
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
    position: "absolute", // Position the button at the top-left corner
    top: 50, // Adjust based on your layout (e.g., status bar height)
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    verticalAlign: "center",
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
