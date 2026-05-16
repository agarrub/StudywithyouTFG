import { CanDeactivateFn } from '@angular/router';
import { Notes } from '../../features/notes/notes';

export const unsavedChangesGuard: CanDeactivateFn<Notes> = (component) => {
  if (component.unsavedChanges()) {
    return confirm(
      'Tienes cambios sin guardar.\n\n¿Seguro que quieres salir? Los cambios que no hayas guardado se perderán.',
    );
  }
  return true;
};
