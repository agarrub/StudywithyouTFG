import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { TodoList, TodoListItem } from '../../core/models/todo-list-item';
import { ToDoListService } from '../services/to-do-list-service';
import { NavigationSidebar } from '../navigation-sidebar/navigation-sidebar';

@Component({
  selector: 'app-to-do-list',
  imports: [NavigationSidebar],
  templateUrl: './to-do-list.html',
  styleUrl: './to-do-list.scss',
})
export class ToDoList implements OnInit {
  private todoListService = inject(ToDoListService);

  public list = signal<TodoList | null>(null);
  public tasks = signal<TodoListItem[]>([]);
  public newTask = signal<string>('');

  private getList() {
    this.todoListService.getLists().subscribe({
      next: (lists) => {
        if (lists && lists.length > 0) {
          const obtainedList = lists[0];
          this.list.set(obtainedList);
          this.loadTasks(obtainedList.id);
        } else {
          this.createList();
        }
      },
      error: (error) => console.error(error),
    });
  }

  private createList() {
    this.todoListService.createList({ title: 'Mi Lista de Tareas', id: '', list: [] }).subscribe({
      next: () => {
        this.getList();
      },
      error: (error) => console.error(error),
    });
  }

  private loadTasks(listID: string) {
    this.todoListService.getTasks(listID).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
      },
      error: (error) => console.error(error),
    });
  }

  onUpdateTitle(newTitle: string) {
    const currentList = this.list();
    if (currentList && newTitle.trim() !== '' && newTitle !== currentList.title) {
      const updateList = { title: newTitle, listID: currentList.id };
      this.todoListService.updateList(updateList).subscribe({
        next: () => this.list.set({ ...currentList, title: newTitle }),
        error: (error) => console.error(error),
      });
    }
  }

  onAddTask(taskValue: string) {
    const currentList = this.list();
    if (!currentList || taskValue.trim() === '') return;

    this.newTask.set('');
    const tempId = crypto.randomUUID();
    this.tasks.set([...this.tasks(), { task: taskValue, id: tempId, done: false }]);

    this.todoListService.addTask(taskValue, currentList.id).subscribe({
      next: (response: any) => {
        const taskID = response.message;
        if (taskID) {
          this.tasks.update((tasks) =>
            tasks.map((task) => (task.id === tempId ? { ...task, id: taskID } : task)),
          );
        }
      },
      error: (error: any) => {
        console.error(error);
        this.tasks.update((tasks) => tasks.filter((task) => task.id !== tempId));
      },
    });
  }

  onToggleTask(item: TodoListItem) {
    const currentList = this.list();
    if (!currentList) return;

    const updatedTask = { ...item, done: !item.done };
    this.todoListService.updateTask(updatedTask, currentList.id).subscribe({
      next: () => {
        this.tasks.update((tasks) =>
          tasks.map((task) => (task.id === item.id ? updatedTask : task)),
        );
      },
      error: (error) => console.error(error),
    });
  }

  onDeleteTask(taskID: string) {
    const currentList = this.list();
    if (!currentList) return;

    this.todoListService.deleteTask(taskID, currentList.id).subscribe({
      next: () => {
        this.tasks.update((tasks) => tasks.filter((task) => task.id !== taskID));
      },
      error: (error) => console.error(error),
    });
  }

  ngOnInit(): void {
    this.getList();
  }
}
