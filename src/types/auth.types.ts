export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}