import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { RadarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import {
  HorrorColors,
  HorrorGradients,
  HorrorShadows,
  getCreepyMessage,
  createPulseAnimation,
} from '../styles/horrorTheme';

const { width } = Dimensions.get("window");

const ResultsScreen = ({ route, navigation }) => {
  const { answers } = route.params;

  // Animation values
  const chartPulse = useRef(new Animated.Value(0)).current;
  const titleFlicker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Chart pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(chartPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(chartPulse, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Title flicker animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleFlicker, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(titleFlicker, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Show a loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HorrorColors.bloodRed} />
        <Text style={styles.loadingText}>{getCreepyMessage()}</Text>
      </View>
    );
  }

  // Aggregate the answers to compute average values for each category
  const aggregated = answers.reduce((acc, curr) => {
    for (let key in curr) {
      acc[key] = (acc[key] || 0) + curr[key];
    }
    return acc;
  }, {});

  const labels = Object.keys(aggregated);
  const data = Object.values(aggregated).map(value => value / answers.length);

  const maxValue = Math.max(...data) * 1.2; // Add 20% padding to the maximum value

  // Prepare data for RadarChart as an array of numbers
  const radarData = data;

  const chartAnimation = createPulseAnimation(chartPulse);
  const titleAnimation = {
    opacity: titleFlicker.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: [1, 0.6, 1, 0.4, 1, 0.7],
    }),
  };

  return (
    <LinearGradient
      colors={HorrorGradients.abyss}
      style={styles.gradientBackground}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* Go Back Button */}
        <TouchableOpacity
          style={{ ...styles.goBackButton, backgroundColor: HorrorColors.shadowGray, borderColor: HorrorColors.bloodRed, borderWidth: 2 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={HorrorColors.ghostWhite} />
          <Text style={styles.goBackText}>ESCAPE</Text>
        </TouchableOpacity>

        <Animated.Text style={[styles.title, titleAnimation]}>
          💀 YOUR JUDGMENT 💀
        </Animated.Text>
        <Text style={styles.subtitle}>
          Your moral profile has been analyzed...
        </Text>

        <Animated.View style={[styles.chartContainer, chartAnimation]}>
          <RadarChart
            data={radarData}
            maxValue={maxValue}
            chartSize={width * 0.75}
            labels={labels}
            noOfSections={5}

            // Configuration for grid lines
            gridConfig={{
              stroke: HorrorColors.bloodRed,
              strokeWidth: 2,
              strokeDashArray: [4, 4],
              fill: "none",
              showGradient: false,
            }}

            // Configuration for the polygon (data area)
            polygonConfig={{
              stroke: HorrorColors.crimson,
              strokeWidth: 3,
              fill: `rgba(139, 0, 0, 0.4)`,
              opacity: 0.9,
              showGradient: false,
            }}

            // Configuration for the aster lines (radial lines)
            asterLinesConfig={{
              stroke: HorrorColors.eerieGreen,
              strokeWidth: 1,
              strokeDashArray: [2, 2],
            }}

            // Label configurations for axis labels
            labelConfig={{
              fontSize: 13,
              fontFamily: "Poppins_700Bold",
              stroke: HorrorColors.eerieGreen,
              textAnchor: 'middle',
              alignmentBaseline: 'middle',
            }}

            // Data labels (values at each data point)
            dataLabels={labels}

            // Configuration for data labels
            dataLabelsConfig={{
              fontSize: 11,
              fontFamily: "Poppins_600SemiBold",
              stroke: HorrorColors.ghostWhite,
              textAnchor: 'middle',
              alignmentBaseline: 'middle',
            }}

            hideAsterLines={false}
            hideGrid={false}
            hideLabels={false}
            showdataValuesAsLabels={true}
            isAnimated={true}
            animationDuration={1200}
            animateTogether={true}
            labelsPositionOffset={12}
            dataLabelsPositionOffset={10}
          />
        </Animated.View>

        {/* Summary Section Below the Chart */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>⚠ MORAL PROFILE ⚠</Text>
          {labels.map((label, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>☠ {label}:</Text>
              <Text style={styles.summaryValue}>{data[index].toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.summaryFooter}>
            Your conscience has been weighed and measured.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// Stylesheet for the component
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  goBackButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Poppins_700Bold",
    marginTop: 60,
    color: HorrorColors.crimson,
    textAlign: 'center',
    textShadowColor: HorrorColors.bloodRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 10,
    marginBottom: 20,
    color: HorrorColors.eerieGreen,
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chartContainer: {
    marginVertical: 30,
    padding: 20,
    backgroundColor: HorrorColors.charcoal,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: HorrorColors.bloodRed,
    ...HorrorShadows.ominous,
  },
  summary: {
    marginTop: 20,
    width: "90%",
    backgroundColor: HorrorColors.charcoal,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: HorrorColors.crimson,
    ...HorrorShadows.bloodGlow,
  },
  summaryTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: HorrorColors.warningOrange,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 2,
    textShadowColor: HorrorColors.darkCrimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: HorrorColors.shadowGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HorrorColors.fogGray,
  },
  summaryLabel: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    color: HorrorColors.eerieGreen,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: HorrorColors.ghostWhite,
  },
  summaryFooter: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: HorrorColors.ashGray,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HorrorColors.voidBlack,
  },
  loadingText: {
    color: HorrorColors.eerieGreen,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: HorrorColors.eerieGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chartLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: HorrorColors.ghostWhite,
  },
});

export default ResultsScreen;
