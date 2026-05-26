import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SavePomodoro } from '../../core/models/save-pomodoro';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PomodoroServices {
  private url = `${environment.apiUrl}/pomodoro`;

  private http = inject(HttpClient);

  public savePomodoro(pomodoro: SavePomodoro): Observable<SavePomodoro> {
    return this.http.post<SavePomodoro>(this.url, pomodoro, { withCredentials: true });
  }
}
