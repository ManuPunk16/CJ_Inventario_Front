import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { Inventario } from '../../core/models/inventario.model';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  displayedColumns: string[] = [
    'acciones',
    'codigoUbicacion',
    'tipoMaterial',
    'nombre',
    'cantidad',
    'unidadMedida',
    'ubicacion',
    'stockMinimo'
  ];
  dataSource = new MatTableDataSource<Inventario>();
  isLoading = true;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventarioService: InventarioService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarInventario(): void {
    this.isLoading = true;
    this.inventarioService.getInventario().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.dataSource.data = response.data;
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar el inventario';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalles(item: Inventario): void {
    // Implementar navegación a la vista de detalles
    this.router.navigate(['/inventario/detalles', item._id]);
  }

  editarItem(item: Inventario): void {
    // Implementar navegación a la vista de edición
    this.router.navigate(['/inventario/editar', item._id]);
  }

  nuevoItem(): void {
    if (!this.authService.hasRole('admin')) {
      Swal.fire({
        title: 'Error',
        text: 'No tienes permisos para realizar esta acción',
        icon: 'error',
        confirmButtonColor: 'var(--primary-500)'
      });
      return;
    }

    Swal.fire({
      title: 'Nuevo Item de Inventario',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Tipo de Material <span class="text-red-500">*</span>
            </label>
            <select id="tipoMaterial" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
              <option value="">Seleccione un tipo</option>
              <option value="oficina">Material de Oficina</option>
              <option value="limpieza">Material de Limpieza</option>
              <option value="varios">Varios</option>
            </select>
            <span id="tipoMaterial-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input id="nombre" type="text" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="nombre-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Cantidad <span class="text-red-500">*</span>
            </label>
            <input id="cantidad" type="number" min="0" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="cantidad-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Unidad de Medida <span class="text-red-500">*</span>
            </label>
            <select id="unidadMedida" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
              <option value="">Seleccione una unidad</option>
              <option value="pieza">Pieza</option>
              <option value="litro">Litro</option>
              <option value="kilogramo">Kilogramo</option>
              <option value="metro">Metro</option>
              <option value="gramo">Gramo</option>
              <option value="mililitro">Mililitro</option>
              <option value="unidad">Unidad</option>
              <option value="caja">Caja</option>
              <option value="paquete">Paquete</option>
              <option value="rollo">Rollo</option>
              <option value="otro">Otro</option>
            </select>
            <span id="unidadMedida-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Stock Mínimo</label>
            <input id="stockMinimo" type="number" min="0" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Anaquel <span class="text-red-500">*</span>
            </label>
            <input id="anaquel" type="text" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="anaquel-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Nivel <span class="text-red-500">*</span>
            </label>
            <input id="nivel" type="number" min="1" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="nivel-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea id="observaciones" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"></textarea>
          </div>
          <div class="text-xs text-gray-500">
            Los campos marcados con <span class="text-red-500">*</span> son obligatorios
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-500)',
      cancelButtonColor: 'var(--gray-500)',
      didOpen: () => {
        // Agregar eventos de validación en tiempo real
        const camposRequeridos = ['tipoMaterial', 'nombre', 'cantidad', 'unidadMedida', 'anaquel', 'nivel'];

        camposRequeridos.forEach(campo => {
          const elemento = document.getElementById(campo);
          const errorSpan = document.getElementById(`${campo}-error`);

          if (elemento && errorSpan) {
            elemento.addEventListener('input', () => {
              if (elemento instanceof HTMLSelectElement || elemento instanceof HTMLInputElement) {
                if (!elemento.value.trim()) {
                  elemento.classList.add('border-red-500');
                  errorSpan.classList.remove('hidden');
                } else {
                  elemento.classList.remove('border-red-500');
                  errorSpan.classList.add('hidden');
                }
              }
            });
          }
        });
      },
      preConfirm: () => {
        const camposRequeridos: Array<{ id: string; nombre: string }> = [
          { id: 'tipoMaterial', nombre: 'Tipo de Material' },
          { id: 'nombre', nombre: 'Nombre' },
          { id: 'cantidad', nombre: 'Cantidad' },
          { id: 'unidadMedida', nombre: 'Unidad de Medida' },
          { id: 'anaquel', nombre: 'Anaquel' },
          { id: 'nivel', nombre: 'Nivel' }
        ];

        const errores: string[] = [];
        const valores: { [key: string]: any } = {};

        camposRequeridos.forEach(campo => {
          const elemento = document.getElementById(campo.id);
          const errorSpan = document.getElementById(`${campo.id}-error`);

          if (elemento instanceof HTMLSelectElement || elemento instanceof HTMLInputElement) {
            const valor = elemento.value.trim();
            valores[campo.id] = valor;

            if (!valor) {
              elemento.classList.add('border-red-500');
              if (errorSpan) errorSpan.classList.remove('hidden');
              errores.push(`El campo ${campo.nombre} es requerido`);
            } else {
              elemento.classList.remove('border-red-500');
              if (errorSpan) errorSpan.classList.add('hidden');
            }
          }
        });

        if (errores.length > 0) {
          Swal.showValidationMessage(errores.join('<br>'));
          return false;
        }

        // Convertir valores numéricos
        valores['cantidad'] = parseInt(valores['cantidad']);
        valores['nivel'] = parseInt(valores['nivel']);
        valores['stockMinimo'] = parseInt((document.getElementById('stockMinimo') as HTMLInputElement).value) || 0;
        valores['observaciones'] = (document.getElementById('observaciones') as HTMLTextAreaElement).value.trim();

        // Generar el código de ubicación
        const anaquel = valores['anaquel'].toUpperCase();
        const nivel = valores['nivel'];
        valores['codigoUbicacion'] = `${anaquel}-N${nivel}`;

        // Crear el objeto de ubicación
        valores['ubicacion'] = {
          anaquel: valores['anaquel'],
          nivel: valores['nivel'],
          observaciones: valores['observaciones']
        };

        // Eliminar propiedades redundantes
        delete valores['anaquel'];
        delete valores['observaciones'];

        return valores;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.inventarioService.crearInventario(result.value).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Item creado correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--primary-500)'
              });
              this.cargarInventario();
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al crear el item',
              icon: 'error',
              confirmButtonColor: 'var(--primary-500)'
            });
          }
        });
      }
    });
  }

  eliminarItem(id: string): void {
    if (confirm('¿Está seguro de eliminar este item?')) {
      this.inventarioService.eliminarInventario(id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.cargarInventario();
          }
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
        }
      });
    }
  }
}
