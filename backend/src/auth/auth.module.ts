import { Module } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    SupabaseModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret-key-for-development',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard],
})
export class AuthModule {}