# Sistema de Autenticação e Autorização

## Guards Disponíveis

### JwtAuthGuard
Guarda que verifica se o usuário está autenticado (possui um token JWT válido).

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('exemplo')
@UseGuards(JwtAuthGuard)
export class ExemploController {
  // Todas as rotas deste controller requerem autenticação
}
```

### RolesGuard
Guarda que verifica se o usuário possui as roles necessárias para acessar a rota.

**Uso básico:**
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // Apenas usuários com role 'admin' podem acessar
}
```

**Múltiplas roles (OR):**
```typescript
@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'supervisor')
export class EmpresasController {
  // Usuários com role 'admin' OU 'supervisor' podem acessar
}
```

**Aplicar em rotas específicas:**
```typescript
@Controller('processos')
@UseGuards(JwtAuthGuard)
export class ProcessosController {
  // Rota pública (apenas autenticada)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Rota que requer role admin
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }
}
```

## Acessando o Usuário Autenticado

```typescript
import { Request } from '@nestjs/common';

@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Request() req) {
  const user = req.user; // { id, email, nome, roles, empresaId }
  return user;
}
```

## Estrutura do Usuário

O objeto `req.user` contém:
- `id`: string - ID do usuário
- `email`: string - Email do usuário
- `nome`: string - Nome do usuário
- `roles`: string[] - Array de roles do usuário
- `empresaId`: string | null - ID da empresa (se houver)

## Roles Disponíveis

- `admin`: Administrador do sistema
- `associado`: Associado
- `fornecedor`: Fornecedor
- `user`: Usuário padrão

