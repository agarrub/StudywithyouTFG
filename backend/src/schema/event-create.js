import * as z from 'zod';

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, 'El título es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().optional().or(z.literal('')),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  allDay: z.preprocess((val) => val === true || val === 1, z.boolean()),
});