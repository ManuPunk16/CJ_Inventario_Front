import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, switchMap, filter, take, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AuthResponse,
  User,
  UserRole,
  RefreshTokenResponse
} from '../models/auth.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private refreshTokenTimeout: any;
  private accessToken = '';
  private refreshToken = '';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.setSession(response)),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    // Verificar si ya hay un proceso de logout en marcha
    if (localStorage.getItem('logout_in_progress')) {
      console.log('Proceso de logout ya en curso');
      return;
    }
    
    // Detener el timer de refresh
    this.stopRefreshTokenTimer();
    
    // Establecer bandera de logout en progreso
    localStorage.setItem('logout_in_progress', 'true');
    
    // Obtener token actual
    const token = this.getAccessToken();
    
    // Si hay token, intentar logout en el servidor
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {})
        .pipe(
          finalize(() => {
            this.clearTokensAndRedirect();
            // Eliminar bandera después de un tiempo
            setTimeout(() => {
              localStorage.removeItem('logout_in_progress');
            }, 2000);
          })
        )
        .subscribe({
          next: () => console.log('Logout exitoso en el servidor'),
          error: (error) => console.warn('Error en logout del servidor:', error)
        });
    } else {
      // Si no hay token, solo limpiar datos locales
      this.clearTokensAndRedirect();
      // Eliminar bandera después de un tiempo
      setTimeout(() => {
        localStorage.removeItem('logout_in_progress');
      }, 2000);
    }
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data)
    );
  }

  refreshAccessToken(): Observable<RefreshTokenResponse> {
    // Si ya hay un logout en progreso, no intentar refresh
    if (localStorage.getItem('logout_in_progress')) {
      return throwError(() => new Error('Logout en progreso, refresh token cancelado'));
    }
    
    const refreshToken = this.refreshToken || localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('No hay refresh token para renovar la sesión');
      // Importante: Evitar ciclos usando una bandera
      if (!localStorage.getItem('logout_in_progress')) {
        this.clearTokensAndRedirect();
      }
      return throwError(() => new Error('No refresh token'));
    }
    
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        this.startRefreshTokenTimer();
      }),
      catchError(error => {
        console.error('Error en refresh token:', error);
        
        // Importante: Si el refresh token falló por expiración, hacer logout limpio
        if (error.error?.code === 'REFRESH_TOKEN_EXPIRED' || 
            error.error?.code === 'INVALID_REFRESH_TOKEN') {
          if (!localStorage.getItem('logout_in_progress')) {
            console.log('Refresh token expirado o inválido, haciendo logout');
            this.clearTokensAndRedirect();
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      // Verificar si el token ha expirado
      const decodedToken = this.decodeToken(token);
      const isExpired = this.isTokenExpired(token);
      
      return !isExpired;
    } catch (error) {
      console.error('Error al verificar el token:', error);
      return false;
    }
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    
    const now = Date.now() / 1000;
    return decoded.exp < now;
  }

  hasRole(role: string): boolean {
    const user = this.userSubject.value;
    return user !== null && user.role === role;
  }

  private setSession(authResult: AuthResponse): void {
    this.accessToken = authResult.accessToken;
    this.refreshToken = authResult.refreshToken;

    localStorage.setItem('accessToken', this.accessToken);
    localStorage.setItem('refreshToken', this.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResult.user));

    this.userSubject.next(authResult.user);
    this.startRefreshTokenTimer();
  }

  private handleLogout(): void {
    this.stopRefreshTokenTimer();

    this.accessToken = '';
    this.refreshToken = '';
    this.userSubject.next(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): void {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken && storedUser) {
      this.accessToken = storedAccessToken;
      this.refreshToken = storedRefreshToken;
      this.userSubject.next(JSON.parse(storedUser));
      this.startRefreshTokenTimer();
    }
  }

  private startRefreshTokenTimer(): void {
    const jwtToken = JSON.parse(atob(this.accessToken.split('.')[1]));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshAccessToken().subscribe();
    }, Math.max(0, timeout));
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private clearTokens(): void {
    this.accessToken = '';
    this.refreshToken = '';
    this.userSubject.next(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  refreshAuthToken() {
    const refreshToken = this.getRefreshToken();
    
    // Si no hay refresh token, forzar logout
    if (!refreshToken) {
      console.log('No hay refresh token disponible');
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }
    
    // Si hay un token, intentar refresh
    return this.http.post<any>('/api/auth/refresh-token', { refreshToken });
  }

  private getRefreshToken(): string {
    return this.refreshToken;
  }

  // Método para evitar duplicidad y asegurar limpieza consistente
  private clearTokensAndRedirect(): void {
    // Limpiar datos de sesión
    this.stopRefreshTokenTimer();
    this.accessToken = '';
    this.refreshToken = '';
    this.userSubject.next(null);
    
    // Limpiar localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redireccionar al login
    this.router.navigate(['/login']);
  }
}

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(this.addToken(request)).pipe(
      catchError(error => {
        if (error.status === 401 && error.error?.code === 'TOKEN_EXPIRED') {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshAccessToken().pipe(
        switchMap((token) => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addToken(request));
        }),
        catchError((err) => {
          this.refreshTokenInProgress = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(this.addToken(request)))
      );
    }
  }
}
