import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SavePomodoro } from '../../core/models/save-pomodoro';

@Injectable({
  providedIn: 'root',
})
export class PomodoroServices {
  private url = 'http://localhost:3000/pomodoro';

  private http = inject(HttpClient);

  public savePomodoro(pomodoro: SavePomodoro): Observable<SavePomodoro> {
    return this.http.post<SavePomodoro>(this.url, pomodoro, { withCredentials: true });
  }
}
