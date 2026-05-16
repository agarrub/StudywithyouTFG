export interface TodoListItem {
    id: string,
    task: string,
    done: boolean
};

export interface TodoList{
    title: string,
    id: string,
    list: TodoListItem[]
}
