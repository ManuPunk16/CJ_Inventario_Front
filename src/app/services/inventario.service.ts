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
    entrada: Omit<Entrada, 'fecha'>
  ): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<InventarioResponse>(
      `${this.apiUrl}/${id}/entradas`,
      entrada,
      { headers }
    );
  }

  agregarSalida(
    id: string,
    salida: Omit<Salida, 'fecha'>
  ): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<InventarioResponse>(
      `${this.apiUrl}/${id}/salidas`,
      salida,
      { headers }
    );
  }

  getInventarioById(id: string): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<InventarioResponse>(`${this.apiUrl}/${id}`, { headers });
  }
}
