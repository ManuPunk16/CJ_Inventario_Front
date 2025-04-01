import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = environment.apiUrl + '/inventario';

  constructor(private http: HttpClient) { }

  getInventario(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(this.apiUrl, { headers });
  }

  crearInventario(inventario: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.apiUrl, inventario, { headers });
  }

  // Agrega más métodos para las demás operaciones (actualizar, eliminar, etc.)
}
