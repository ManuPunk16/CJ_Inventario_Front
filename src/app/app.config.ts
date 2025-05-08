import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http'; // Importa provideHttpClient y withInterceptors
import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor'; // Importa el interceptor como función HttpInterceptorFn
import { provideAnimations } from '@angular/platform-browser/animations'; // Importa provideAnimations
import { platformBrowser } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([AuthInterceptor])
    ),
    provideAnimations()
  ]
};
