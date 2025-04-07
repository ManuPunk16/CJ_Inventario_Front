import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import {
  Inventario,
  InventarioResponse,
  InventariosResponse,
  Salida,
  Entrada,
  ApiResponse,
} from '../core/models/inventario.model';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private apiUrl = environment.apiUrl + '/inventario';

  constructor(private http: HttpClient) {}

  getInventario(): Observable<InventariosResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<InventariosResponse>(this.apiUrl, { headers });
  }

  crearInventario(
    inventario: Omit<Inventario, '_id'>
  ): Observable<InventarioResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<InventarioResponse>(this.apiUrl, inventario, {
      headers,
    });
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
}
