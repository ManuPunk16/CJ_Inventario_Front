export type UserRole = 'admin' | 'user';

export interface User {
    id?: string;
    username: string;
    password?: string;
    role?: UserRole;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    status: 'success' | 'error';
    token: string;
    message?: string;
    user?: User;
}

export interface RegisterRequest {
    username: string;
    password: string;
    role?: UserRole;
}

export interface AuthResponse {
    status: 'success' | 'error';
    message: string;
    data?: any;
}
