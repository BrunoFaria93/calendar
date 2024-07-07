import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyCalendar from './components/Calendar';

const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <MyCalendar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
