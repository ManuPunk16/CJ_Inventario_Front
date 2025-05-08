import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environments';
import {
  Inventario,
  InventarioResponse,
  InventariosResponse,
  Salida,
  Entrada,
  ApiResponse,
} from '../core/models/inventario.model';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

export interface PaginatedResults<T> {
  status: string;
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private apiUrl = environment.apiUrl + '/inventario';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getInventario(page: number = 0, pageSize: number = 10): Observable<InventariosResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<InventariosResponse>(this.apiUrl, { headers, params });
  }

  // inventario.service.ts
  crearInventario(inventario: Omit<Inventario, '_id'>): Observable<InventarioResponse> {
    // Obtén el token actual usando el servicio de autenticación
    const token = this.authService.getAccessToken();
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Eliminar codigoUbicacion si existe para que el backend lo genere
    const datosParaEnviar = { ...inventario };
    delete datosParaEnviar.codigoUbicacion;
    
    return this.http.post<InventarioResponse>(this.apiUrl, datosParaEnviar, { headers })
      .pipe(
        catchError(error => {
          console.error('Error en la petición:', error);
          return throwError(() => error);
        })
      );
  }

  actualizarInventario(
    id: string,
    inventario: Partial<Inventario>
  ): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<InventarioResponse>(
      `${this.apiUrl}/${id}`,
      inventario,
      { headers }
    );
  }

  eliminarInventario(id: string): Observable<ApiResponse<null>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, {
      headers,
    });
  }

  agregarEntrada(
    id: string,
    entrada: Omit<Entrada, 'fecha' | 'registradoPor' | '_id'>
  ): Observable<InventarioResponse> {
    // Obtener token fresco
    const token = this.authService.getAccessToken();
    
    if (!token) {
      console.error('No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }
    
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    // Comprobar que los headers se establecen correctamente
    console.log('Headers enviados:', {
      Authorization: `Bearer ${token.substring(0, 15)}...`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post<InventarioResponse>(
      `${this.apiUrl}/${id}/entradas`,
      entrada,
      { headers }
    ).pipe(
      tap(response => console.log('Respuesta del servidor:', response)),
      catchError(error => {
        console.error('Error detallado en la petición:', error);
        
        // Manejo específico de errores de autenticación
        if (error.status === 401) {
          // Intentar renovar el token si es posible
          console.error('Token expirado o inválido. Intentando reautenticar...');
          // Usar un método público para manejar la renovación del token o redirigir al login
          this.authService.logout(); // O usar otro método público como handleTokenExpiration() si existe
        }        
        return throwError(() => error);
      })
    );
  }

  agregarSalida(
    id: string,
    // Omit registradoPor para que el backend lo maneje
    salida: Omit<Salida, 'fecha' | 'registradoPor' | '_id'>
  ): Observable<InventarioResponse> {
    const token = this.authService.getAccessToken();
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post<InventarioResponse>(
      `${this.apiUrl}/${id}/salidas`,
      salida,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error en la petición:', error);
        return throwError(() => error);
      })
    );
  }

  getInventarioById(id: string): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<InventarioResponse>(`${this.apiUrl}/${id}`, { headers });
  }

  getAuditoriaInventario(id: string): Observable<any> {
    const token = this.authService.getAccessToken();
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<any>(`${this.apiUrl}/${id}/auditoria`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error al obtener auditoría:', error);
          return throwError(() => error);
        })
      );
  }

  // Agregar console.log para depuración
  getEntradasPaginadas(id: string, options: {
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string
  }): Observable<PaginatedResults<Entrada>> {
    const { page = 0, pageSize = 10, sortField = 'fecha', sortOrder = 'desc', search = '' } = options;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('search', search);

    console.log('Solicitando entradas con parámetros:', params.toString());
    console.log('URL de solicitud:', `${this.apiUrl}/${id}/entradas`);
    
    return this.http.get<PaginatedResults<Entrada>>(`${this.apiUrl}/${id}/entradas`, { params }).pipe(
      tap(response => console.log('Respuesta de entradas:', response)),
      catchError(error => {
        console.error('Error al obtener entradas:', error);
        return throwError(() => error);
      })
    );
  }

  getSalidasPaginadas(id: string, options: {
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string
  }): Observable<PaginatedResults<Salida>> {
    const { page = 0, pageSize = 10, sortField = 'fecha', sortOrder = 'desc', search = '' } = options;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortField', sortField)
      .set('sortOrder', sortOrder)
      .set('search', search);

    return this.http.get<PaginatedResults<Salida>>(`${this.apiUrl}/${id}/salidas`, { params });
  }
}
