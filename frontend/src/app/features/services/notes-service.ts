import { inject, Injectable, signal } from '@angular/core';
import { Note, NoteResponse } from '../../core/models/notes';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  public notes = signal<Note[]>([]);
  private http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/notes';

  public readonly getNotes = (): Observable<NoteResponse> => {
    return this.http.get<NoteResponse>(`${this.url}/`, { withCredentials: true });
  };

  public readonly createNote = (note: Note): Observable<NoteResponse> => {
    return this.http.post<NoteResponse>(`${this.url}/create`, note, { withCredentials: true });
  };

  public readonly updateNote = (note: Note): Observable<NoteResponse> => {
    return this.http.put<NoteResponse>(`${this.url}/`, note, { withCredentials: true });
  };

  public readonly deleteNote = (id: string, userID: string): Observable<NoteResponse> => {
    return this.http.delete<NoteResponse>(`${this.url}/`, {
      body: { id, userID },
      withCredentials: true,
    });
  };

  public readonly renameNote = (
    id: string,
    title: string,
    userID: string,
  ): Observable<NoteResponse> => {
    return this.http.patch<NoteResponse>(
      `${this.url}/rename`,
      { id, title, userID },
      { withCredentials: true },
    );
  };
}
