import { USER_ROLES, type UserRole, hasRole, hasAnyRole, isAdmin } from './roles';
import type { User } from '@/types/user';

/**
 * Utilitários de autenticação e autorização
 */

/**
 * Verifica se o usuário tem uma role específica
 */
export const userHasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return hasRole(user.roles, role);
};

/**
 * Verifica se o usuário tem pelo menos uma das roles especificadas
 */
export const userHasAnyRole = (
  user: User | null,
  roles: UserRole[],
): boolean => {
  if (!user) return false;
  return hasAnyRole(user.roles, roles);
};

/**
 * Verifica se o usuário é admin
 */
export const userIsAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return isAdmin(user.roles);
};

/**
 * Verifica se o usuário pode acessar rotas de admin
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return userIsAdmin(user);
};

/**
 * Verifica se o usuário pode acessar rotas de associado
 */
export const canAccessAssociado = (user: User | null): boolean => {
  if (!user) return false;
  return (
    userHasRole(user, USER_ROLES.ADMIN) ||
    userHasRole(user, USER_ROLES.ASSOCIADO)
  );
};

/**
 * Verifica se o usuário pode acessar rotas de fornecedor
 */
export const canAccessFornecedor = (user: User | null): boolean => {
  if (!user) return false;
  return (
    userHasRole(user, USER_ROLES.ADMIN) ||
    userHasRole(user, USER_ROLES.FORNECEDOR)
  );
};

// Re-exportar roles e tipos para facilitar imports
export { USER_ROLES, type UserRole };

