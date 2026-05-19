export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export type UserStatus = 'online' | 'offline' | 'away' | 'dnd';



export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  status: UserStatus;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export type RegisterResponse = AuthResponse;
