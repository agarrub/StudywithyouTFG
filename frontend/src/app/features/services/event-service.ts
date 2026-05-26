import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateEvent, CreateEventResponse } from '../../core/models/create-event';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly url: string = environment.apiUrl;

  public http: HttpClient = inject(HttpClient);

  public readonly createEvent = (data: CreateEvent): Observable<void> => {
    return this.http.post<void>(`${this.url}/event/create-event`, data, { withCredentials: true });
  };

  public readonly getEvents = (): Observable<CreateEventResponse> => {
    return this.http.get<CreateEventResponse>(`${this.url}/event/get-events`, {
      withCredentials: true,
    });
  };

  public readonly deleteEvent = (eventID: string): Observable<void> => {
    return this.http.delete<void>(`${this.url}/event/delete-event`, {
      body: { eventID },
      withCredentials: true,
    });
  };

  public readonly updateEvent = (data: CreateEvent): Observable<void> => {
    return this.http.put<void>(`${this.url}/event/update-event`, data, { withCredentials: true });
  };
}
