import { Component, OnInit } from '@angular/core';
import { InventarioService } from '../../services/inventario.service';
import { Inventario } from '../../core/models/inventario.model';

@Component({
  selector: 'app-inventario',
  imports: [],
  standalone: true,
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit {
  inventario: Inventario[] = [];

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    this.obtenerInventario();
  }

  obtenerInventario(): void {
    this.inventarioService.getInventario().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.inventario = response.data;
          console.log('Inventario obtenido:', this.inventario);
        }
      },
      error: (error) => {
        console.error('Error al obtener el inventario:', error);
      },
    });
  }

  // Agrega más métodos para las demás operaciones (crear, actualizar, eliminar, etc.)
}
