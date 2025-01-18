import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { RadarChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get("window");

const ResultsScreen = ({ route }) => {
  const { answers } = route.params;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
      </View>
    );
  }

  // Aggregate the values
  const aggregated = answers.reduce((acc, curr) => {
    for (let key in curr) {
      acc[key] = (acc[key] || 0) + curr[key];
    }
    return acc;
  }, {});

  const labels = Object.keys(aggregated);
  const data = Object.values(aggregated).map(value => value / answers.length);

  const maxValue = Math.max(...data) * 1.2; // Add some padding

  // Prepare data for RadarChart (array of numbers)
  const radarData = data; // Directly use the array of numbers

  return (
    <LinearGradient
      colors={["#2C2C3E", "#1E1E2E"]}
      style={styles.gradientBackground}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: "#E0E0E0" }]}>Your Results</Text>
        <RadarChart
          data={radarData}
          maxValue={maxValue}
          size={width * 0.8} // Adjust the size as needed
          gradientColor={[
            { offset: '0%', color: 'rgba(108, 113, 255, 0.3)' },
            { offset: '100%', color: 'rgba(108, 113, 255, 0.1)' },
          ]}
          strokeColor="#6C71FF"
          strokeWidth={2}
          labelColor="#E0E0E0"
          labelSize={12}
          labelFontFamily="Poppins_600SemiBold"
          dataFillColor="rgba(108, 113, 255, 0.3)"
          dataFillOpacity={0.8}
          dataStrokeColor="#6C71FF"
          dataStrokeWidth={2}
          isCircle
        />
        <View style={styles.summary}>
          {labels.map((label, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: "#E0E0E0" }]}>{label}:</Text>
              <Text style={[styles.summaryValue, { color: "#E0E0E0" }]}>{data[index].toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 20,
  },
  summary: {
    marginTop: 20,
    width: "100%",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResultsScreen;
