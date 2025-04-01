import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Importa provideHttpClient y withInterceptors
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor'; // Importa el interceptor como función HttpInterceptorFn

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor]))
  ] // Agrega provideHttpClient y el interceptor
};
