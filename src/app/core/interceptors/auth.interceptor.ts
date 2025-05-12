import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, Observable, switchMap, catchError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Crear variables en el ámbito del módulo para mantener estado
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  
  // Excluir rutas de autenticación del proceso de interceptación
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/refresh-token') || 
      req.url.includes('/auth/logout')) {
    return next(req);
  }
  
  const authReq = addToken(req, authService);
  
  return next(authReq).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const errorCode = error.error?.code;
        
        if (errorCode === 'TOKEN_EXPIRED') {
          return handle401Error(req, next, authService);
        } else {
          // Prevenir ciclos infinitos con control
          console.log('Error de autenticación no recuperable:', errorCode);
          if (!localStorage.getItem('logout_in_progress')) {
            authService.logout();
          }
          return throwError(() => error);
        }
      }
      
      return throwError(() => error);
    })
  );
};

// Helpers para mejorar legibilidad
function addToken(request: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const token = authService.getAccessToken();
  if (token) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return request;
}

function handle401Error(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn,
  authService: AuthService
): Observable<any> {
  if (isRefreshing) {
    // Si ya estamos refrescando, esperamos al resultado
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const newRequest = addToken(request, authService);
        return next(newRequest);
      })
    );
  }
  
  isRefreshing = true;
  refreshTokenSubject.next(null);
  
  return authService.refreshAccessToken().pipe(
    switchMap((response) => {
      isRefreshing = false;
      refreshTokenSubject.next(response.accessToken);
      
      const newRequest = addToken(request, authService);
      return next(newRequest);
    }),
    catchError(error => {
      isRefreshing = false;
      refreshTokenSubject.next(null);
      
      // Importante: control para evitar ciclos
      if (!localStorage.getItem('logout_in_progress')) {
        localStorage.setItem('logout_in_progress', 'true');
        console.log('Error en refresh token, haciendo logout');
        authService.logout();
        // Limpiar después de un tiempo
        setTimeout(() => localStorage.removeItem('logout_in_progress'), 2000);
      }
      
      return throwError(() => error);
    })
  );
}
