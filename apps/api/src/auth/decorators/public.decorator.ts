import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca uma rota como isenta do JwtAuthGuard global (ver auth/guards/jwt-auth.guard.ts).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
