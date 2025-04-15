import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

interface MarkedDates {
  [key: string]: {
    marked: boolean;
    dotColor: string;
    selected: boolean;
    selectedColor: string;
  };
}

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/challenges', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const challenges = await response.json();

      const dates: MarkedDates = {};
      
      challenges.forEach((challenge: any) => {
        challenge.progressLogs.forEach((log: any) => {
          const date = format(new Date(log.date), 'yyyy-MM-dd');
          dates[date] = {
            marked: true,
            dotColor: '#4CAF50',
            selected: date === selectedDate,
            selectedColor: '#4CAF50',
          };
        });
      });

      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    // Here you can add logic to show details for the selected day
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
          },
        }}
        markingType="dot"
        theme={{
          selectedDayBackgroundColor: '#4CAF50',
          todayTextColor: '#4CAF50',
          dotColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
      />
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          <Text>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FF5252' }]} />
          <Text>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
}); 