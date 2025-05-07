import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout()
    });
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data)
    );
  }

  refreshAccessToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, { refreshToken: this.refreshToken }).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        this.startRefreshTokenTimer();
      }),
      catchError(error => {
        this.handleLogout();
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken && !!this.userSubject.value;
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
}
