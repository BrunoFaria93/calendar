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
import {formatDate} from '../utils/utils';
import {ScheduleItem} from '../types/CalendarTypes';
import TimeZone from 'react-native-timezone';
import {Globe04SVG, Trash01SVG} from './Icons';

const MyCalendar: React.FC = () => {
  const [markedDates, setMarkedDates] = useState<{[date: string]: any}>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [scheduledTimes, setScheduledTimes] = useState<{
    [date: string]: ScheduleItem[];
  }>({});

  const [deviceTimeZone, setDeviceTimeZone] = useState<string>('');

  useEffect(() => {
    const fetchTimeZone = async () => {
      try {
        const timezone = await TimeZone.getTimeZone();
        setDeviceTimeZone(timezone);
      } catch (error) {
        console.error('Failed to fetch timezone', error);
      }
    };

    fetchTimeZone();
  }, []);

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

      let savedSchedules: ScheduleItem[] = [];

      // Se estiver adicionando "Unavailable", limpa todos os horários existentes
      if (startTime === 'Unavailable') {
        savedSchedules = [{startTime: 'Unavailable', endTime: ''}];

        // Remove qualquer entrada existente para este dia
        await AsyncStorage.removeItem(`schedule_${selectedDate}`);

        const updatedMarkedDates = {...markedDates};
        updatedMarkedDates[selectedDate] = {marked: true, dotColor: '#00FF00'};
        setMarkedDates(updatedMarkedDates);

        setScheduledTimes(prev => ({
          ...prev,
          [selectedDate]: savedSchedules,
        }));
      } else {
        // Remove qualquer entrada "Unavailable" existente
        savedSchedules = (scheduledTimes[selectedDate] || []).filter(
          schedule => schedule.startTime !== 'Unavailable',
        );

        // Adiciona o novo horário
        const newSchedule: ScheduleItem = {startTime, endTime};
        savedSchedules.push(newSchedule);

        // Salva no AsyncStorage
        await AsyncStorage.setItem(
          `schedule_${selectedDate}`,
          JSON.stringify(savedSchedules),
        );

        // Atualiza marcadores e horários
        const updatedMarkedDates = {...markedDates};
        updatedMarkedDates[selectedDate] = {marked: true, dotColor: '#00FF00'};
        setMarkedDates(updatedMarkedDates);

        setScheduledTimes(prev => ({
          ...prev,
          [selectedDate]: savedSchedules,
        }));
      }

      setBottomSheetVisible(false);
    } catch (error) {
      console.error('Failed to save schedule', error);
    }
  };

  const handleDelete = async (date: string, index: number) => {
    try {
      // Verifica se a data está marcada como "Unavailable"
      if (scheduledTimes[date]?.[0]?.startTime === 'Unavailable') {
        // Remove a entrada completa para esta data
        await AsyncStorage.removeItem(`schedule_${date}`);

        // Remove a data dos marcadores e horários programados
        const updatedMarkedDates = {...markedDates};
        delete updatedMarkedDates[date];
        setMarkedDates(updatedMarkedDates);

        const updatedScheduledTimes = {...scheduledTimes};
        delete updatedScheduledTimes[date];
        setScheduledTimes(updatedScheduledTimes);

        return; // Retorna após a remoção completa da data
      }

      // Verifica se scheduledTimes[date] existe e tem pelo menos um item
      if (!scheduledTimes[date] || scheduledTimes[date].length === 0) {
        // Se não houver horários agendados para esta data, remove completamente
        await AsyncStorage.removeItem(`schedule_${date}`);

        const updatedMarkedDates = {...markedDates};
        delete updatedMarkedDates[date];
        setMarkedDates(updatedMarkedDates);

        const updatedScheduledTimes = {...scheduledTimes};
        delete updatedScheduledTimes[date];
        setScheduledTimes(updatedScheduledTimes);

        return;
      }

      // Remove o horário específico do array
      const updatedSchedules = [...scheduledTimes[date]];
      updatedSchedules.splice(index, 1);

      if (updatedSchedules.length === 0) {
        // Se não houver mais horários, remove a entrada completa para esta data
        await AsyncStorage.removeItem(`schedule_${date}`);

        const updatedMarkedDates = {...markedDates};
        delete updatedMarkedDates[date];
        setMarkedDates(updatedMarkedDates);

        const updatedScheduledTimes = {...scheduledTimes};
        delete updatedScheduledTimes[date];
        setScheduledTimes(updatedScheduledTimes);
      } else {
        // Atualiza os horários restantes para esta data
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
  
    // Obter todas as datas e ordená-las
    const sortedDates = Object.keys(scheduledTimes).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
  
    return (
      <ScrollView contentContainerStyle={{paddingHorizontal: 10}}>
        {sortedDates.map(date => {
          const schedules = scheduledTimes[date];
          const hasUnavailableTime = schedules.some(
            schedule => schedule.startTime === 'Unavailable',
          );
  
          return (
            <View key={date} style={styles.dateContainer}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <View style={styles.dateHoursContainer}>
                  {schedules.length === 0 ? (
                    <View style={styles.flexRow}>
                      <View style={styles.card}>
                        <Text style={styles.cardText}>Unavailable</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.trashContainer}
                        onPress={() => handleDelete(date, 0)} // assuming only one "Unavailable" entry per day
                      >
                        <Trash01SVG color="#ec3713" height={15} width={15} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    schedules.map((schedule, idx) => (
                      <View key={idx} style={styles.flexRow}>
                        <View style={styles.card}>
                          <Text style={styles.cardText}>
                            {`${schedule.startTime} - ${schedule.endTime}`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.trashContainer}
                          onPress={() => handleDelete(date, idx)}>
                          <Trash01SVG color="#ec3713" height={15} width={15} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          );
        })}
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
      <View style={styles.TimeZoneContainer}>
        <Globe04SVG color="white" height={15} width={15} />

        <Text style={styles.TimeZoneText}>{deviceTimeZone}</Text>
      </View>
      <View style={styles.flexRowPadding}>
        <Text style={styles.TimeZoneText}>Availability for specific dates</Text>
      </View>
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
  card: {
    backgroundColor: '#2C2C2E',
    padding: 5,
    margin: 5,
    marginRight: 10,
    width: '68%',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#8d8d92',
  },
  TimeZoneContainer: {
    backgroundColor: '#2C2C2E',
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  TimeZoneText: {
    marginLeft: 7,
    color: '#f3f3f3',
  },
  trashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trash: {
    height: 15,
    width: 15,
    margin: 5,
    marginBottom: 3,
    marginLeft: 10,
  },
  dateContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    borderTopWidth: 0.5,
    padding: 10,
    borderTopColor: 'gray',
    borderBottomColor: 'gray',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: '#ffffff',
    width: '30%',
    marginTop: 5
  },
  dateHoursContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    width: '70%',
  },
  noScheduledTimesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flexRowPadding: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'gray',
  },
  noScheduledTimesText: {
    fontSize: 16,
    color: '#8d8d92',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MyCalendar;
