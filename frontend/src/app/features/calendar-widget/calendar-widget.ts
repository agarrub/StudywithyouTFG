import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { CalendarOptions, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import timeGridPlugin from '@fullcalendar/timegrid';
import { form, required, FormField } from '@angular/forms/signals';
import { CreateEvent, CreateEventResponse } from '../../core/models/create-event';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EventService } from '../services/event-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-calendar-widget',
  standalone: true,
  imports: [FullCalendarModule, FormField],
  templateUrl: './calendar-widget.html',
  styleUrl: './calendar-widget.scss',
})
export class CalendarWidget implements OnInit {
  public readonly eventService: EventService = inject(EventService);
  public calendarComponent = viewChild<FullCalendarComponent>('calendar');

  createEventModel = signal<CreateEvent>({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    allDay: false,
  });

  createEventForm = form(this.createEventModel, (schema) => {
    required(schema.title, { message: 'Title is required' });
    required(schema.startDate, { message: 'Start date is required' });
    required(schema.endDate, { message: 'End date is required' });
    required(schema.startTime, { message: 'Start time is required' });
    required(schema.endTime, { message: 'End time is required' });
  });

  modifyEventModel = signal<CreateEvent>({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    allDay: false,
  });

  modifyEventForm = form(this.modifyEventModel, (schema) => {
    required(schema.title, { message: 'Title is required' });
    required(schema.startDate, { message: 'Start date is required' });
  });

  public isDayClicked = signal<boolean | null>(null);
  public isEventClicked = signal<boolean | null>(null);
  public isAllDayChecked = signal<boolean>(false);
  public isModifyAllDayChecked = signal<boolean>(false);
  public isCalendarLoaded = signal<boolean>(false);
  public actualCalendarEvent = signal<EventApi | null>(null);
  public eventsList = signal<CreateEvent[]>([]);
  public eventCount = signal<number>(0);

  calendarOptions = signal<CalendarOptions>({
    themeSystem: 'standard',
    initialView: 'dayGridMonth',
    firstDay: 1,
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: {
      left: 'prev,next,today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    locale: 'esLocale',
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
    },
    titleFormat: {
      month: 'long',
      year: 'numeric',
      day: 'numeric',
    },
    weekends: true,
    editable: true,
    events: [],
    droppable: false,
    dateClick: (info: any) => {
      this.isDayClicked.set(true);

      const now = new Date();
      const localStartTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const endNow = new Date(now.getTime() + 60 * 60 * 1000);
      const localEndTime = `${endNow.getHours().toString().padStart(2, '0')}:${endNow.getMinutes().toString().padStart(2, '0')}`;

      this.createEventModel.set({
        title: '',
        startDate: info.dateStr,
        endDate: info.dateStr,
        startTime: localStartTime,
        endTime: localEndTime,
        allDay: false,
      });
    },

    eventClick: (info: any) => {
      this.isEventClicked.set(true);

      const start = info.event.start;
      const end = info.event.end;

      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const formatTime = (d: Date) => {
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${min}`;
      };

      this.modifyEventModel.set({
        title: info.event.title,
        startDate: formatDate(start),
        endDate: end ? formatDate(end) : formatDate(start),
        startTime: info.event.allDay ? '' : formatTime(start),
        endTime: end && !info.event.allDay ? formatTime(end) : '',
        allDay: info.event.allDay,
      });

      this.isModifyAllDayChecked.set(info.event.allDay);
      this.actualCalendarEvent.set(info.event);
    },
  });

  onCreateEvent($event: Event) {
    $event.preventDefault();
    const data = this.createEventForm().value();

    const eventForCalendar = {
      title: data.title,
      start: data.allDay ? data.startDate : `${data.startDate}T${data.startTime}`,
      end: data.allDay ? data.endDate : `${data.endDate}T${data.endTime}`,
      allDay: data.allDay,
    };
    this.isDayClicked.set(false);

    this.eventService.createEvent(data).subscribe({
      next: () => {
        this.getCalendarAPI()?.addEvent(eventForCalendar);
        this.onGetEvents();
        window.location.reload();
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  onGetEvents() {
    this.eventService.getEvents().subscribe({
      next: (response) => {
        response.events.forEach((dbEvent: any) => {
          this.getCalendarAPI()?.addEvent({
            id: dbEvent.id.toString(),
            title: dbEvent.title,
            start: dbEvent.start_datetime,
            end: dbEvent.end_datetime,
            allDay: dbEvent.allDay === 1 || dbEvent.allDay === true,
          });
        });

        const htmlData = response.events.map((e: any) => {
          const startDate = e.start_datetime
            ? e.start_datetime.split('T')[0].split('-').reverse().join('-')
            : '';
          const startTime = e.start_datetime ? e.start_datetime.split('T')[1].substring(0, 5) : '';

          const endDate = e.end_datetime
            ? e.end_datetime.split('T')[0].split('-').reverse().join('-')
            : startDate;
          const endTime = e.end_datetime ? e.end_datetime.split('T')[1].substring(0, 5) : '';

          return {
            ...e,
            startDate: startDate,
            startTime: startTime,
            endDate: endDate,
            endTime: endTime,
          };
        });

        this.eventsList.set(htmlData);
        this.eventCount.set(htmlData.length);
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  onModifyEvent($event: Event) {
    $event.preventDefault();
    const data = this.modifyEventForm().value();

    const eventForCalendar = {
      title: data.title,
      start: data.allDay ? data.startDate : `${data.startDate}T${data.startTime}`,
      end: data.allDay ? data.endDate : `${data.endDate}T${data.endTime}`,
      allDay: data.allDay,
    };
    this.isEventClicked.set(false);

    const eventID = this.actualCalendarEvent()?.id;
    this.eventService.updateEvent({ ...data, eventID } as any).subscribe({
      next: () => {
        this.getCalendarAPI()?.addEvent(eventForCalendar);
        this.getCalendarAPI()?.refetchEvents();
        window.location.reload();
      },
      error: (error) => {
        console.error(error);
      },
    });

    if (this.isCalendarLoaded()) {
      this.onGetEvents();
    }
  }

  ngOnInit(): void {
    this.onGetEvents();
  }

  private getCalendarAPI() {
    return this.calendarComponent()?.getApi();
  }

  onDeleteEvent() {
    const id = this.actualCalendarEvent()?.id ?? ''.toString();
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        this.getCalendarAPI()?.getEventById(id)?.remove();
      },
      error: (error) => {
        console.error(error);
      },
    });
    this.getCalendarAPI()?.refetchEvents();
    this.isEventClicked.set(false);
  }

  public getEvents(): Observable<CreateEventResponse> {
    return this.eventService.getEvents();
  }
}
