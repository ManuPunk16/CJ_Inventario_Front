import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

// La función del interceptor
export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Inyectar dependencias
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Variables estáticas para manejar el refreshToken
  // Nota: Como las funciones no mantienen estado entre llamadas,
  // necesitamos usar variables estáticas o un servicio para esto
  if (!(window as any).refreshTokenState) {
    (window as any).refreshTokenState = {
      inProgress: false,
      subject: new BehaviorSubject<string | null>(null)
    };
  }
  
  const refreshTokenState = (window as any).refreshTokenState;

  // Si la solicitud es para login o refreshToken, no añadir token
  if (req.url.includes('login') || req.url.includes('refresh-token')) {
    return next(req);
  }

  const token = authService.getAccessToken();
  
  if (token) {
    req = addToken(req, token);
  }
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        return handle401Error(req, next, refreshTokenState, authService, router);
      }
      
      return throwError(() => error);
    })
  );
};

// Función para añadir token a la petición
function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

// Función para manejar errores 401
function handle401Error(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn,
  refreshTokenState: { inProgress: boolean, subject: BehaviorSubject<string | null> },
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!refreshTokenState.inProgress) {
    refreshTokenState.inProgress = true;
    refreshTokenState.subject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((response) => {
        refreshTokenState.inProgress = false;
        refreshTokenState.subject.next(response.accessToken);
        
        return next(addToken(request, response.accessToken));
      }),
      catchError((error) => {
        refreshTokenState.inProgress = false;
        authService.logout();
        router.navigate(['/login']);
        
        return throwError(() => error);
      })
    );
  } else {
    return refreshTokenState.subject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(request, token!)))
    );
  }
}
