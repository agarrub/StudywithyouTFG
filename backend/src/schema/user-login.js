import * as z from 'zod';

export const UserLoginSchema = z.object({
  email: z
    .email()
    .min(4, 'Email is required')
    .max(255, 'Email should not have more than 255 characters.'),
  password: z.string().min(6, 'Password is required'),
});
