export interface Note {
  id: string;
  title: string;
  content?: string;
  created_at?: Date;
  updated_at?: Date;
  userID: string;
}

export interface NoteResponse {
  notes: Note[];
}
