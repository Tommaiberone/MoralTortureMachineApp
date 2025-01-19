import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { RadarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons'; // Optional: For icons

const { width } = Dimensions.get("window");

const ResultsScreen = ({ route, navigation }) => {
  const { answers } = route.params;

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Show a loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C71FF" />
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

  return (
    <LinearGradient
      colors={["#2C2C3E", "#1E1E2E"]}
      style={styles.gradientBackground}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        {/* Go Back Button */}
        <TouchableOpacity style={{ ...styles.goBackButton, backgroundColor: "#6C71FF" }} onPress={() => navigation.goBack()}>
          {/* Optional: Add an icon */}
          <Ionicons name="arrow-back" size={24} color="#E0E0E0" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: "#E0E0E0" }]}>Your Results</Text>
        <RadarChart
          data={radarData} // Array of numbers
          maxValue={maxValue} // Maximum value for scaling
          chartSize={width * 0.8} // Size of the chart
          labels={labels} // Labels for each axis
          noOfSections={5} // Number of concentric circles
          
          // Configuration for grid lines
          gridConfig={{
            stroke: "#6C71FF",
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            fill: "none",
            showGradient: false, // Disable gradient to prevent errors
          }}
          
          // Configuration for the polygon (data area)
          polygonConfig={{
            stroke: "#6C71FF",
            strokeWidth: 2,
            fill: "rgba(108, 113, 255, 0.3)",
            opacity: 0.8,
            showGradient: false, // Disable gradient to prevent errors
          }}
          
          // Configuration for the aster lines (radial lines)
          asterLinesConfig={{
            stroke: "#6C71FF",
            strokeWidth: 1,
            strokeDashArray: [2, 2],
          }}
          
          // Label configurations for axis labels
          labelConfig={{
            fontSize: 14,
            fontFamily: "Poppins_600SemiBold",
            stroke: "#E0E0E0",
            textAnchor: 'middle', // Center the labels
            alignmentBaseline: 'middle',
          }}
          
          // Data labels (values at each data point)
          dataLabels={labels}
          
          // Configuration for data labels
          dataLabelsConfig={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            stroke: "#E0E0E0",
            textAnchor: 'middle', // Center the data labels
            alignmentBaseline: 'middle',
          }}
          
          // Additional styling and behavior props
          hideAsterLines={false}
          hideGrid={false}
          hideLabels={false}
          showdataValuesAsLabels={true} // Show data values on the chart
          isAnimated={true} // Enable animations
          animationDuration={800} // Animation duration in milliseconds
          animateTogether={true} // Animate data points sequentially
          labelsPositionOffset={10} // Offset for axis labels
          dataLabelsPositionOffset={10} // Offset for data labels
        />
        
        {/* Summary Section Below the Chart */}
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

// Stylesheet for the component
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative', // To ensure absolute positioning of the button works correctly
  },
  goBackButton: {
    position: 'absolute', // Position the button at the top-left corner
    top: 40, // Adjust based on your layout (e.g., status bar height)
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  goBackText: {
    color: "#E0E0E0",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 5, // Space between icon and text
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 60, // To provide space below the Go Back button
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
  chartLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#E0E0E0",
  },
});

export default ResultsScreen;
