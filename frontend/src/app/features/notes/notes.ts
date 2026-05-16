import { Component, signal, viewChild, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import * as mammoth from 'mammoth';
import htmlToPdfmake from 'html-to-pdfmake';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts;
import { NotesService } from '../services/notes-service';
import { Note } from '../../core/models/notes';
import { AuthService } from '../services/auth-service';
import { NavigationSidebar } from '../navigation-sidebar/navigation-sidebar';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-notes',
  imports: [QuillEditorComponent, FormsModule, NavigationSidebar],
  templateUrl: './notes.html',
  styleUrl: './notes.scss',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class Notes implements OnInit {
  private auth: AuthService = inject(AuthService);
  private notesService = inject(NotesService);

  public user = this.auth.user;
  public notes = this.notesService.notes;

  public wordsCount = new Subject<number>();

  public isNoteSelected = signal<boolean>(false);
  public renamingNoteId = signal<string | null>(null);
  public selectedNote = signal<Note | null>(null);
  public newNoteTouched = signal<boolean>(false);
  public unsavedChanges = computed(() => {
    if (!this.isNoteSelected() || !this.selectedNote()) return false;
    return this.editorContent() !== (this.selectedNote()?.content ?? '');
  });

  public quillComponent = viewChild<QuillEditorComponent>('editor');

  public editorContent = signal<string>('');

  quillConfig: any = {
    history: {
      delay: 1000,
      maxStack: 500,
    },
  };

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.unsavedChanges()) {
      event.preventDefault();
      return '';
    }
    return;
  }

  public createNote(title: string): void {
    const noteID = crypto.randomUUID();
    this.notesService
      .createNote({
        id: noteID,
        title: title,
        userID: this.user()?.id!,
      })
      .subscribe((note) => {
        this.notesService.notes.set(note.notes);
        const createdNote = note.notes.find((n: Note) => n.id === noteID);
        if (createdNote) {
          this.selectNote(createdNote);
        }
      });
  }

  public selectNote(note: Note): void {
    this.selectedNote.set(note);
    this.editorContent.set(note.content ?? '');
    this.isNoteSelected.set(true);
  }

  public saveNote(): void {
    this.notesService
      .updateNote({
        id: this.selectedNote()?.id!,
        title: this.selectedNote()?.title!,
        content: this.editorContent(),
        created_at: this.selectedNote()?.created_at!,
        updated_at: new Date(),
        userID: this.user()?.id!,
      })
      .subscribe((note) => {
        this.notesService.notes.set(note.notes);
        this.isNoteSelected.set(false);
        this.newNoteTouched.set(false);
      });
  }

  public deleteNote(id: string): void {
    this.notesService.deleteNote(id, this.user()?.id!).subscribe((note) => {
      this.notesService.notes.set(note.notes);
      this.isNoteSelected.set(false);
      this.selectedNote.set(null);
    });
  }

  public startRenaming(noteId: string, event: Event): void {
    event.stopPropagation();
    this.renamingNoteId.set(noteId);
  }

  public renameNote(id: string, newTitle: string): void {
    if (!newTitle.trim()) return;
    this.renamingNoteId.set(null);
    this.notesService.renameNote(id, newTitle, this.user()?.id!).subscribe(() => {
      this.notesService.getNotes().subscribe((res) => {
        this.notesService.notes.set(res.notes);
      });
    });
  }

  public exportToPDF(): void {
    const contentHTML: any = htmlToPdfmake(this.editorContent());
    pdfMake
      .createPdf({
        content: contentHTML,
      })
      .download(`${this.selectedNote()?.title ?? 'nota'}.pdf`);
  }

  public async importFromWord($event: Event): Promise<void> {
    const file = ($event.target as HTMLInputElement).files![0];

    if (
      !file ||
      file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    this.editorContent.set(value);
  }

  ngOnInit(): void {
    this.notesService.getNotes().subscribe((notes) => {
      this.notesService.notes.set(notes.notes);
    });
  }
}
