/**
 * Definição de roles do sistema
 * Compatível com o backend (Usuario.roles: string[])
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  ASSOCIADO: 'associado',
  FORNECEDOR: 'fornecedor',
  USER: 'user', // Role padrão já existente
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Verifica se o usuário tem uma role específica
 * @param userRoles - Array de roles do usuário
 * @param requiredRole - Role requerida
 * @returns true se o usuário tem a role
 */
export const hasRole = (userRoles: string[], requiredRole: UserRole): boolean => {
  return userRoles.includes(requiredRole);
};

/**
 * Verifica se o usuário tem pelo menos uma das roles especificadas
 * @param userRoles - Array de roles do usuário
 * @param requiredRoles - Array de roles requeridas
 * @returns true se o usuário tem pelo menos uma das roles
 */
export const hasAnyRole = (
  userRoles: string[],
  requiredRoles: UserRole[],
): boolean => {
  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Verifica se o usuário tem todas as roles especificadas
 * @param userRoles - Array de roles do usuário
 * @param requiredRoles - Array de roles requeridas
 * @returns true se o usuário tem todas as roles
 */
export const hasAllRoles = (
  userRoles: string[],
  requiredRoles: UserRole[],
): boolean => {
  return requiredRoles.every((role) => userRoles.includes(role));
};

/**
 * Verifica se o usuário é admin
 * @param userRoles - Array de roles do usuário
 * @returns true se o usuário é admin
 */
export const isAdmin = (userRoles: string[]): boolean => {
  return hasRole(userRoles, USER_ROLES.ADMIN);
};

