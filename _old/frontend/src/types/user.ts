import { UserRole } from '@/lib/core/roles';

/**
 * Interface do usuário autenticado
 * Compatível com a resposta do backend
 */
export interface User {
  id: string;
  email: string;
  nome: string;
  roles: string[]; // Array de roles (compatível com backend)
  empresaId?: string | null;
}

/**
 * Tipo para usuário com roles tipadas
 */
export interface TypedUser extends Omit<User, 'roles'> {
  roles: UserRole[];
}

/**
 * Helper para verificar se um usuário tem uma role específica
 */
export const userHasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.roles.includes(role);
};

/**
 * Helper para verificar se um usuário é admin
 */
export const userIsAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.roles.includes('admin');
};

