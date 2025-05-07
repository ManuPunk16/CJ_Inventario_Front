import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
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
import { Inventario, AreaTipo } from '../../core/models/inventario.model';
import { AuthService } from '../../core/services/auth.service';
import { 
  AREAS, 
  TIPO_MATERIAL, 
  UNIDAD_MEDIDA, 
  getAreaValues, 
  getTipoMaterialValues, 
  getUnidadMedidaValues 
} from '../../utils/enums';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class InventarioComponent implements OnInit, OnDestroy {
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

  totalItems = 0;
  pageSize = 25;
  pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  currentPage = 0;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  // Hacer disponibles las enumeraciones en la plantilla
  AREAS_VALUES = getAreaValues();
  TIPO_MATERIAL_VALUES = getTipoMaterialValues();
  UNIDAD_MEDIDA_VALUES = getUnidadMedidaValues();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventarioService: InventarioService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
    
    // Suscribirse al usuario actual
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    // En lugar de asignar el paginador directamente, nos suscribimos a sus eventos
    this.paginator.page.subscribe((pageEvent: PageEvent) => {
      this.pageSize = pageEvent.pageSize;
      this.currentPage = pageEvent.pageIndex;
      this.cargarInventario(this.currentPage, this.pageSize);
    });

    this.dataSource.sort = this.sort;
  }

  cargarInventario(page: number = 0, pageSize: number = this.pageSize): void {
    this.isLoading = true;
    this.inventarioService.getInventario(page, pageSize).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dataSource.data = response.items;
          this.totalItems = response.totalItems || 0;
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

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarInventario();
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalles(item: Inventario): void {
    this.router.navigate(['/inventario/detalles', item._id]);
  }

  editarItem(item: Inventario): void {
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
      title: 'Editar Item de Inventario',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Tipo de Material <span class="text-red-500">*</span>
            </label>
            <select id="tipoMaterial" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
              <option value="">Seleccione un tipo</option>
              ${this.TIPO_MATERIAL_VALUES.map(tipo => 
                `<option value="${tipo}" ${item.tipoMaterial === tipo ? 'selected' : ''}>${this.formatTipoMaterial(tipo)}</option>`
              ).join('')}
            </select>
            <span id="tipoMaterial-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input id="nombre" type="text" value="${item.nombre}" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="nombre-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Stock Mínimo
            </label>
            <input id="stockMinimo" type="number" value="${item.stockMinimo}" min="0" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Anaquel <span class="text-red-500">*</span>
            </label>
            <input id="anaquel" type="text" value="${item.ubicacion.anaquel}" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="anaquel-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Nivel <span class="text-red-500">*</span>
            </label>
            <input id="nivel" type="number" value="${item.ubicacion.nivel}" min="1" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="nivel-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-500)',
      cancelButtonColor: 'var(--gray-500)',
      preConfirm: () => {
        const valores: { [key: string]: any } = {};
        const camposRequeridos = ['tipoMaterial', 'nombre', 'anaquel', 'nivel'];
        const errores: string[] = [];

        camposRequeridos.forEach(campo => {
          const elemento = document.getElementById(campo) as HTMLInputElement | HTMLSelectElement;
          const valor = elemento.value.trim();
          valores[campo] = valor;

          if (!valor) {
            elemento.classList.add('border-red-500');
            const errorSpan = document.getElementById(`${campo}-error`);
            if (errorSpan) errorSpan.classList.remove('hidden');
            errores.push(`El campo ${campo} es requerido`);
          }
        });

        if (errores.length > 0) {
          Swal.showValidationMessage(errores.join('<br>'));
          return false;
        }

        valores['stockMinimo'] = parseInt((document.getElementById('stockMinimo') as HTMLInputElement).value) || 0;

        // Crear el objeto de ubicación
        valores['ubicacion'] = {
          anaquel: valores['anaquel'].toUpperCase(),
          nivel: parseInt(valores['nivel'])
        };

        // Eliminar propiedades redundantes
        delete valores['anaquel'];
        delete valores['nivel'];

        return valores;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.inventarioService.actualizarInventario(item._id!, result.value).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Item actualizado correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--primary-500)'
              });
              this.cargarInventario();
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al actualizar el item',
              icon: 'error',
              confirmButtonColor: 'var(--primary-500)'
            });
          }
        });
      }
    });
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
              ${this.TIPO_MATERIAL_VALUES.map(tipo => 
                `<option value="${tipo}">${this.formatTipoMaterial(tipo)}</option>`
              ).join('')}
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
              ${this.UNIDAD_MEDIDA_VALUES.map(unidad => 
                `<option value="${unidad}">${this.formatUnidadMedida(unidad)}</option>`
              ).join('')}
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

        // Modificamos la generación del código de ubicación para incluir más información
        const anaquel = valores['anaquel'].toUpperCase();
        const nivel = valores['nivel'];
        const shortTimestamp = Date.now().toString().slice(-4);
        valores['codigoUbicacion'] = `A${anaquel}-N${nivel}-${shortTimestamp}`;

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
        const nuevoInventario: Omit<Inventario, '_id'> = result.value as Omit<Inventario, '_id'>;
        this.inventarioService.crearInventario(nuevoInventario).subscribe({
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
      title: '¿Está seguro?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--error-color)',
      cancelButtonColor: 'var(--gray-500)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventarioService.eliminarInventario(id).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              Swal.fire({
                title: '¡Eliminado!',
                text: 'El item ha sido eliminado correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--primary-500)'
              });
              this.cargarInventario();
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al eliminar el item',
              icon: 'error',
              confirmButtonColor: 'var(--primary-500)'
            });
          }
        });
      }
    });
  }

  agregarEntrada(item: Inventario): void {
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
      title: 'Agregar Entrada',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Cantidad <span class="text-red-500">*</span>
            </label>
            <input id="cantidad" type="number" min="1" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="cantidad-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Proveedor
            </label>
            <input id="proveedor" type="text" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea id="observaciones" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-500)',
      cancelButtonColor: 'var(--gray-500)',
      preConfirm: () => {
        const cantidad = parseInt((document.getElementById('cantidad') as HTMLInputElement).value);
        if (!cantidad || cantidad < 1) {
          Swal.showValidationMessage('La cantidad debe ser mayor a 0');
          return false;
        }

        return {
          cantidad,
          proveedor: (document.getElementById('proveedor') as HTMLInputElement).value.trim(),
          observaciones: (document.getElementById('observaciones') as HTMLTextAreaElement).value.trim()
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.inventarioService.agregarEntrada(item._id!, result.value).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Entrada registrada correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--primary-500)'
              });
              this.cargarInventario();
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al registrar la entrada',
              icon: 'error',
              confirmButtonColor: 'var(--primary-500)'
            });
          }
        });
      }
    });
  }

  agregarSalida(item: Inventario): void {
    // Obtener usuario actual
    const usuarioActual = this.currentUser?.username || 'Usuario Desconocido';

    Swal.fire({
      title: 'Agregar Salida',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Cantidad <span class="text-red-500">*</span>
            </label>
            <input id="cantidad" type="number" min="1" max="${item.cantidad}" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="cantidad-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Área Solicitante <span class="text-red-500">*</span>
            </label>
            <select id="area" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
              <option value="">Seleccione un área</option>
              ${this.AREAS_VALUES.map(area => 
                `<option value="${area}">${area}</option>`
              ).join('')}
            </select>
            <span id="area-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Solicitante <span class="text-red-500">*</span>
            </label>
            <input id="solicitante" type="text" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]">
            <span id="solicitante-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Entregado por <span class="text-red-500">*</span>
            </label>
            <input
              id="quienEntrega"
              type="text"
              value="${usuarioActual}"
              readonly
              class="mt-1 block w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Motivo <span class="text-red-500">*</span></label>
            <textarea id="motivo" class="mt-1 block w-full p-2 border rounded-md focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"></textarea>
            <span id="motivo-error" class="text-red-500 text-xs hidden">Campo requerido</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-500)',
      cancelButtonColor: 'var(--gray-500)',
      preConfirm: () => {
        const cantidad = parseInt((document.getElementById('cantidad') as HTMLInputElement).value);
        const area = (document.getElementById('area') as HTMLSelectElement).value as AreaTipo;
        const solicitante = (document.getElementById('solicitante') as HTMLInputElement).value.trim();
        const motivo = (document.getElementById('motivo') as HTMLTextAreaElement).value.trim();

        if (!cantidad || cantidad < 1 || cantidad > item.cantidad) {
          Swal.showValidationMessage('Cantidad inválida');
          return false;
        }
        if (!area) {
          Swal.showValidationMessage('Debe seleccionar un área');
          return false;
        }
        if (!solicitante) {
          Swal.showValidationMessage('Debe indicar quien solicita');
          return false;
        }
        if (!motivo) {
          Swal.showValidationMessage('El motivo es requerido');
          return false;
        }

        return {
          cantidad,
          area,
          solicitante,
          quienEntrega: usuarioActual,
          motivo,
          hora: new Date().toLocaleTimeString()
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.inventarioService.agregarSalida(item._id!, result.value).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Salida registrada correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--primary-500)'
              });
              this.cargarInventario();
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: error.error?.message || 'Error al registrar la salida',
              icon: 'error',
              confirmButtonColor: 'var(--primary-500)'
            });
          }
        });
      }
    });
  }

  // Métodos auxiliares para formatear valores de enumeraciones
  formatTipoMaterial(tipo: string): string {
    const formatMap: Record<string, string> = {
      'oficina': 'Material de Oficina',
      'limpieza': 'Material de Limpieza',
      'varios': 'Varios'
    };
    return formatMap[tipo] || tipo;
  }

  formatUnidadMedida(unidad: string): string {
    const formatMap: Record<string, string> = {
      'pieza': 'Pieza',
      'litro': 'Litro',
      'kilogramo': 'Kilogramo',
      'metro': 'Metro',
      'gramo': 'Gramo',
      'mililitro': 'Mililitro',
      'unidad': 'Unidad',
      'caja': 'Caja',
      'paquete': 'Paquete',
      'rollo': 'Rollo',
      'otro': 'Otro'
    };
    return formatMap[unidad] || unidad;
  }
}
