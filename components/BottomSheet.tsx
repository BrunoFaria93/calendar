import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { formatDate } from '../utils/utils';
import { BottomSheetProps, ScheduleItem } from '../types/BottomSheetTypes';



const BottomSheet: React.FC<BottomSheetProps> = ({
  onClose,
  selectedDate,
  onSave,
}) => {
  const [unavailable, setUnavailable] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('06:00 am');
  const [selectedEndTime, setSelectedEndTime] = useState('08:00 pm');
  const [scheduledTimes, setScheduledTimes] = useState<ScheduleItem[]>([]);

const timeSlots = [
    '12:00 am',
    '12:15 am',
    '12:30 am',
    '12:45 am',
    '1:00 am',
    '1:15 am',
    '1:30 am',
    '1:45 am',
    '2:00 am',
    '2:15 am',
    '2:30 am',
    '2:45 am',
    '3:00 am',
    '3:15 am',
    '3:30 am',
    '3:45 am',
    '4:00 am',
    '4:15 am',
    '4:30 am',
    '4:45 am',
    '5:00 am',
    '5:15 am',
    '5:30 am',
    '5:45 am',
    '6:00 am',
    '6:15 am',
    '6:30 am',
    '6:45 am',
    '7:00 am',
    '7:15 am',
    '7:30 am',
    '7:45 am',
    '8:00 am',
    '8:15 am',
    '8:30 am',
    '8:45 am',
    '9:00 am',
    '9:15 am',
    '9:30 am',
    '9:45 am',
    '10:00 am',
    '10:15 am',
    '10:30 am',
    '10:45 am',
    '11:00 am',
    '11:15 am',
    '11:30 am',
    '11:45 am',
    '12:00 pm',
    '12:15 pm',
    '12:30 pm',
    '12:45 pm',
    '1:00 pm',
    '1:15 pm',
    '1:30 pm',
    '1:45 pm',
    '2:00 pm',
    '2:15 pm',
    '2:30 pm',
    '2:45 pm',
    '3:00 pm',
    '3:15 pm',
    '3:30 pm',
    '3:45 pm',
    '4:00 pm',
    '4:15 pm',
    '4:30 pm',
    '4:45 pm',
    '5:00 pm',
    '5:15 pm',
    '5:30 pm',
    '5:45 pm',
    '6:00 pm',
    '6:15 pm',
    '6:30 pm',
    '6:45 pm',
    '7:00 pm',
    '7:15 pm',
    '7:30 pm',
    '7:45 pm',
    '8:00 pm',
    '8:15 pm',
    '8:30 pm',
    '8:45 pm',
    '9:00 pm',
    '9:15 pm',
    '9:30 pm',
    '9:45 pm',
    '10:00 pm',
    '10:15 pm',
    '10:30 pm',
    '10:45 pm',
    '11:00 pm',
    '11:15 pm',
    '11:30 pm',
    '11:45 pm',
];

  useEffect(() => {
    const loadScheduledTimes = async () => {
      if (selectedDate) {
        const storedTimes = await AsyncStorage.getItem(
          `schedule_${selectedDate}`,
        );
        if (storedTimes) {
          const parsedTimes: ScheduleItem[] = JSON.parse(storedTimes);
          setScheduledTimes(parsedTimes);
        }
      }
    };

    loadScheduledTimes();
  }, [selectedDate]);

  const renderTimeItem = (item: string, isStartTime: boolean) => {
    // Verifica se o item atual é o horário selecionado
    const isSelected = isStartTime
      ? selectedStartTime === item
      : selectedEndTime === item;

    // Separa o horário (12:00) e o período (am/pm)
    const [time, period] = item.split(' ');

    return (
      <TouchableOpacity
        style={[styles.timeItem, !isSelected && {backgroundColor: '#1C1C1E'}]}
        onPress={() =>
          isStartTime ? setSelectedStartTime(item) : setSelectedEndTime(item)
        }>
        <Text
          style={[
            styles.timeItemText,
            !isSelected && {color: '#CCCCCC'},
            isSelected && {color: '#22c55e'},
          ]}>
          {time}
        </Text>
        <Text
          style={[
            styles.timeItemText,
            styles.timePeriod,
            !isSelected && {color: '#CCCCCC'},
            isSelected && {color: '#22c55e'},
          ]}>
          {period}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleSave = async () => {
    try {
      if (!selectedDate) {
        console.error('No selected date');
        return;
      }

      const newSchedule: ScheduleItem = {
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
      };

      // Recuperar agendamentos existentes para a data selecionada
      const existingSchedules = await AsyncStorage.getItem(
        `schedule_${selectedDate}`,
      );
      let schedules = existingSchedules ? JSON.parse(existingSchedules) : [];

      // Verificar se já existe um agendamento para a data selecionada
      const existingScheduleIndex = schedules.findIndex(
        (item: any) => item.date === selectedDate,
      );

      if (existingScheduleIndex !== -1) {
        // Se já existir um agendamento para esta data, adicione o novo horário ao array existente
        schedules[existingScheduleIndex].times.push({
          startTime: selectedStartTime,
          endTime: selectedEndTime,
        });
      } else {
        // Se não existir nenhum agendamento para esta data, crie um novo item no array
        schedules.push({
          date: selectedDate,
          times: [
            {
              startTime: selectedStartTime,
              endTime: selectedEndTime,
            },
          ],
        });
      }

      // Salvar a lista atualizada no AsyncStorage
      await AsyncStorage.setItem(
        `schedule_${selectedDate}`,
        JSON.stringify(schedules),
      );

      // Atualize o estado para exibir na UI
      setScheduledTimes(schedules);

      // Notifique o componente pai (MyCalendar) do novo agendamento
      onSave(selectedStartTime, selectedEndTime);

      // Feche o bottom sheet
      onClose();
    } catch (error) {
      console.error('Failed to save schedule', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.largeView}>
          <TouchableOpacity onPress={onClose} />
          <View style={styles.closeButtonIcon} />
        </View>
        <View style={styles.largeView}>
        <Text style={styles.title}>Set availability on {formatDate(selectedDate || "")}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.xButton}>X</Text>
        </TouchableOpacity>
        </View>


        <View style={styles.bottomSheetContent}>
          <Text style={styles.subtitle}>Start work by</Text>
          <View style={styles.timeListContainer}>
            <FlatList
              data={timeSlots}
              keyExtractor={item => item}
              renderItem={({item}) => renderTimeItem(item, true)}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <Text style={styles.subtitle}>End work by</Text>
          <View style={styles.timeListContainer}>
            <FlatList
              data={timeSlots}
              keyExtractor={item => item}
              renderItem={({item}) => renderTimeItem(item, false)}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.unavailableRow}>
            <Text style={styles.unavailableText}>
              Unavailable to work this day
            </Text>
            <Switch
              value={unavailable}
              onValueChange={value => setUnavailable(value)}
            />
          </View>

          <TouchableOpacity style={styles.setTimeButton} onPress={handleSave}>
            <Text style={styles.setTimeButtonText}>Set time</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1C1C1E', // Fundo semi-transparente para destacar o BottomSheet
    padding: 16,
    height: 520, // Aumenta a altura para 600 pixels
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 16,
  },
  largeView: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  closeButton: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    backgroundColor: '#CCCCCC',
    borderRadius: 5,
  },
  xButton: {
    color: '#CCCCCC',
    textAlign: 'right',
    marginTop: 15,
    marginLeft: 125,
    fontSize: 16,
  },
  closeButtonIcon: {
    width: 30,
    height: 5,
    backgroundColor: '#CCCCCC',
    borderRadius: 5,
    marginTop: 2,
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
  bottomSheetContent: {
    marginTop: 16,
  },
  timeListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#1C1C1E',
  },
  timeItemText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  timePeriod: {
    fontSize: 14,
    marginTop: -6,
    color: '#CCCCCC',
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  unavailableText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  setTimeButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  setTimeButtonText: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
});

export default BottomSheet;
