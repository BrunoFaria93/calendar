export interface ScheduleItem {
  date: string;
  times: {
    startTime: string;
    endTime: string;
  }[];
}

export interface BottomSheetProps {
  onClose: () => void;
  selectedDate: string | null;
  onSave: (startTime: string, endTime: string) => void;
}
