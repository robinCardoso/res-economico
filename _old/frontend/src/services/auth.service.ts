import { api } from '@/lib/http';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nome: string;
    roles: string[];
    empresaId?: string | null;
  };
  token: string;
  expiresIn: number;
}

export const authService = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', dto);
    return data;
  },
};

