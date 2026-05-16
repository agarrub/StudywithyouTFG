export type Gender = '' | 'male' | 'female' | 'other';

export interface UserRegister {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: Gender;
  birthDate: string;
  avatar?: string;
}
