import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    SupabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}