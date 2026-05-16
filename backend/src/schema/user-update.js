import * as z from 'zod';

export const UserUpdateSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters long')
      .max(20, 'Name cannot be more than 20 characters long'),
    lastName: z
      .string()
      .min(3, 'Last name must be at least 3 characters long')
      .max(20, 'Last name cannot be more than 20 characters long'),
    email: z
      .string()
      .email()
      .min(4, 'Email is required')
      .max(255, 'Email cannot be more than 255 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']),
    birthDate: z.coerce
      .date()
      .min(new Date('1900-01-01'), 'Birth date must be after 1900-01-01')
      .max(new Date(), 'Birth date cannot be in the future'),
  })
  .refine(
    (data) => {
      if (data.password && data.password.trim() !== '') {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords are not the same',
      path: ['confirmPassword'],
    }
  );
