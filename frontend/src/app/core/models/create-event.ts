export interface CreateEvent {
  id?: number;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

export interface CreateEventResponse {
  events: CreateEvent[];
}
