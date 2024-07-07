import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import BottomSheet from './BottomSheet';
import AsyncStorage from '@react-native-community/async-storage';
import { formatDate } from '../utils/utils';
import { ScheduleItem } from '../types/CalendarTypes';



const MyCalendar: React.FC = () => {
  const [markedDates, setMarkedDates] = useState<{[date: string]: any}>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [scheduledTimes, setScheduledTimes] = useState<{
    [date: string]: ScheduleItem[];
  }>({});

  useEffect(() => {
    const fetchSavedSchedules = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const savedSchedules = await AsyncStorage.multiGet(
          keys.filter(key => key.startsWith('schedule_')),
        );

        const markedDatesData: {[date: string]: any} = {};
        const scheduledTimesData: {[date: string]: ScheduleItem[]} = {};

        savedSchedules.forEach(([key, value]) => {
          const date = key.replace('schedule_', '');
          if (value) {
            const schedules = JSON.parse(value);
            scheduledTimesData[date] = Array.isArray(schedules)
              ? schedules
              : [schedules];
            markedDatesData[date] = {marked: true, dotColor: '#00FF00'};
          } else {
            scheduledTimesData[date] = [];
            markedDatesData[date] = {marked: true, dotColor: '#00FF00'};
          }
        });

        console.log('Fetched schedules:', scheduledTimesData); // Debugging

        setMarkedDates(markedDatesData);
        setScheduledTimes(scheduledTimesData);
      } catch (error) {
        console.error('Failed to fetch saved schedules', error);
      }
    };

    fetchSavedSchedules();
  }, []);

  useEffect(() => {
    const updateScheduledTimes = async () => {
      try {
        const savedSchedules = await AsyncStorage.multiGet(
          Object.keys(markedDates).map(date => `schedule_${date}`),
        );

        const scheduledTimesData: {[date: string]: ScheduleItem[]} = {};

        savedSchedules.forEach(([key, value]) => {
          const date = key.replace('schedule_', '');
          if (value) {
            const schedules = JSON.parse(value);
            scheduledTimesData[date] = Array.isArray(schedules)
              ? schedules
              : [schedules];
          } else {
            scheduledTimesData[date] = [];
          }
        });

        console.log('Updated schedules:', scheduledTimesData); // Debugging

        setScheduledTimes(scheduledTimesData);
      } catch (error) {
        console.error('Failed to update scheduled times', error);
      }
    };

    updateScheduledTimes();
  }, [markedDates]);

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setBottomSheetVisible(true);
  };

  const handleSave = async (startTime: string, endTime: string) => {
    try {
      if (!selectedDate) {
        console.error('No selected date');
        return;
      }

      const newSchedule: ScheduleItem = {startTime, endTime};

      let savedSchedules: ScheduleItem[] = scheduledTimes[selectedDate] || [];

      savedSchedules.push(newSchedule);

      await AsyncStorage.setItem(
        `schedule_${selectedDate}`,
        JSON.stringify(savedSchedules),
      );

      const updatedMarkedDates = {...markedDates};
      updatedMarkedDates[selectedDate] = {marked: true, dotColor: '#00FF00'};
      setMarkedDates(updatedMarkedDates);

      setScheduledTimes(prev => ({
        ...prev,
        [selectedDate]: savedSchedules,
      }));

      setBottomSheetVisible(false);
    } catch (error) {
      console.error('Failed to save schedule', error);
    }
  };

  const handleDelete = async (date: string, index: number) => {
    try {
      const updatedSchedules = [...scheduledTimes[date]];
      updatedSchedules.splice(index, 1);

      if (updatedSchedules.length === 0) {
        await AsyncStorage.removeItem(`schedule_${date}`);
        const updatedMarkedDates = {...markedDates};
        delete updatedMarkedDates[date];
        setMarkedDates(updatedMarkedDates);

        const updatedScheduledTimes = {...scheduledTimes};
        delete updatedScheduledTimes[date];
        setScheduledTimes(updatedScheduledTimes);
      } else {
        await AsyncStorage.setItem(
          `schedule_${date}`,
          JSON.stringify(updatedSchedules),
        );
        setScheduledTimes(prev => ({
          ...prev,
          [date]: updatedSchedules,
        }));
      }
    } catch (error) {
      console.error('Failed to delete schedule', error);
    }
  };



  const renderScheduledTimes = () => {
    console.log('Rendering scheduled times');

    if (Object.keys(scheduledTimes).length === 0) {
      return (
        <View style={styles.noScheduledTimesContainer}>
          <Text style={styles.noScheduledTimesText}>
            Select a date on the calendar to override your regular weekly hours
            on a specific day.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Object.entries(scheduledTimes).map(([date, schedules]) => (
          <View key={date} style={styles.dateContainer}>
            <View style={styles.dateCell}>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <View style={styles.dateMiniContainer}>
                {schedules.map((schedule, idx) => (
                  <View key={idx} style={styles.dateHours}>
                    <View style={styles.card}>
                      <Text
                        style={
                          styles.cardText
                        }>{`${schedule.startTime} - ${schedule.endTime}`}</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleDelete(date, idx)}>
                      <Image
                        source={require('../assets/trash.png')}
                        style={styles.trash}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={day => handleDayPress(day.dateString)}
        theme={{
          backgroundColor: '#060607',
          calendarBackground: '#060607',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#2C2C2E',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#00adf5',
          dayTextColor: '#d9e1e8',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: 'orange',
          monthTextColor: 'white',
          indicatorColor: 'white',
          textDayFontFamily: 'monospace',
          textMonthFontFamily: 'monospace',
          textDayHeaderFontFamily: 'monospace',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
      />
      {renderScheduledTimes()}
      {bottomSheetVisible && (
        <BottomSheet
          onClose={() => setBottomSheetVisible(false)}
          selectedDate={selectedDate || ''}
          onSave={handleSave}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060607',
    paddingVertical: 50,
    position: 'relative',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  cardContainer: {
    marginTop: 20,
  },
  card: {
    backgroundColor: '#2C2C2E',
    padding: 5,
    marginBottom: 12,
    marginRight: 12,
    width: '50%',
    display: "flex",
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#8d8d92',
  },
  noScheduledTimesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  noScheduledTimesText: {
    fontSize: 16,
    color: '#F3F3F3',
    paddingHorizontal: 14,
    marginTop: 50,
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
    alignContent: 'center',
    width: '95%',
    borderTopWidth: 0.5, 
    borderTopColor: 'gray', 
    borderBottomColor: 'gray', 
  },
  dateMiniContainer: {
    display: 'flex',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: "center",
    width: '95%',
    flexDirection: 'column',
    marginTop: 13
  },
  dateCell: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateHours: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: "center"
  },
  dateText: {
    fontSize: 14,
    color: '#d2d2d2',
    marginRight: 10,
    marginTop: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trash: {
    height: 15,
    width: 15,
    marginBottom: 8
  },
});

export default MyCalendar;
