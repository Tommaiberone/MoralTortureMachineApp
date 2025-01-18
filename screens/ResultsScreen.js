import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get("window");

const ResultsScreen = ({ route }) => {
  const { answers } = route.params;

  let [fontsLoaded] = useFonts({
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

  // Prepare data for LineChart
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: data,
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(108, 113, 255, ${opacity})`, // Line color
        fill: false,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#2C2C3E",
    backgroundGradientTo: "#1E1E2E",
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(224, 224, 224, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(224, 224, 224, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#6C71FF",
    },
    propsForBackgroundLines: {
      stroke: "#6C71FF",
      strokeDasharray: "", // solid lines
    },
  };

  return (
    <LinearGradient
      colors={["#2C2C3E", "#1E1E2E"]}
      style={styles.gradientBackground}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: "#E0E0E0" }]}>Your Results</Text>
        <LineChart
          data={chartData}
          width={width * 0.9}
          height={300}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          fromZero
          yAxisSuffix=""
          yAxisInterval={1} // optional, defaults to 1
          verticalLabelRotation={-45}
          segments={5}
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
  chartStyle: {
    borderRadius: 16,
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
d