import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    AuthModule,
    SupabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}