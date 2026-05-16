import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TodoList, TodoListItem } from '../../core/models/todo-list-item';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToDoListService {
  private http = inject(HttpClient);

  private url = 'http://localhost:3000/todolist';

  public selectedList = signal<TodoList | null>(null);

  public createList = (list: TodoList): Observable<TodoList> => {
    return this.http.post<TodoList>(`${this.url}/create`, list, { withCredentials: true });
  };

  public addTask = (taskValue: string, listID: string): Observable<any> => {
    return this.http.post<any>(`${this.url}/task/create`, { task: taskValue, listID }, { withCredentials: true });
  };

  public getLists = (): Observable<TodoList[]> => {
    return this.http.get<TodoList[]>(`${this.url}/lists`, { withCredentials: true });
  };

  public updateList = (payload: { title: string, listID: string }): Observable<void> => {
    return this.http.put<void>(`${this.url}/update`, payload, { withCredentials: true });
  };

  public updateTask = (task: TodoListItem, listID: string): Observable<void> => {
    return this.http.put<void>(`${this.url}/task/update`, { task, listID }, { withCredentials: true });
  };

  public getTasks = (listID: string): Observable<TodoListItem[]> => {
    return this.http.get<TodoListItem[]>(`${this.url}/task/${listID}`, { withCredentials: true });
  };

  public deleteList = (listID: string): Observable<void> => {
    return this.http.delete<void>(`${this.url}/delete`, { body: { listID }, withCredentials: true });
  };

  public deleteTask = (taskID: string, listID: string): Observable<void> => {
    return this.http.delete<void>(`${this.url}/task/delete`, { body: { taskID, listID }, withCredentials: true });
  };
}
