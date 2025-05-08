import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Inventario, Entrada, Salida, Ubicacion } from '../../core/models/inventario.model';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-detalles-inventario',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    DatePipe,
    MatProgressSpinnerModule
  ],
  templateUrl: './detalles-inventario.component.html',
  styleUrls: ['./detalles-inventario.component.scss']
})
export class DetallesInventarioComponent implements OnInit, OnDestroy {
  item: Inventario | null = null;
  isLoading = true;
  error = '';
  
  // Entradas configuración
  displayedColumnsEntradas = ['fecha', 'cantidad', 'proveedor', 'registradoPor'];
  entradasDataSource = new MatTableDataSource<Entrada>([]);
  @ViewChild('entradasPaginator') entradasPaginator!: MatPaginator;
  @ViewChild('entradasSort') entradasSort!: MatSort;
  
  // Salidas configuración
  displayedColumnsSalidas = ['fecha', 'cantidad', 'area', 'solicitante', 'motivo', 'registradoPor'];
  salidasDataSource = new MatTableDataSource<Salida>([]);
  @ViewChild('salidasPaginator') salidasPaginator!: MatPaginator;
  @ViewChild('salidasSort') salidasSort!: MatSort;
  
  // Auditoria configuración
  historialAuditoria: any[] = [];
  
  // Tabs de control
  activeTabIndex = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private inventarioService: InventarioService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalles(id);
    } else {
      this.error = 'ID no proporcionado';
      this.isLoading = false;
    }
  }

  ngAfterViewInit() {
    // Se inicializarán después de cargar los datos
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDetalles(id: string): void {
    this.inventarioService.getInventarioById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'success' && response.data) {
            this.item = response.data;
            
            // Configurar las tablas de datos
            if (this.item.entradas && this.item.entradas.length > 0) {
              this.entradasDataSource.data = this.item.entradas;
              setTimeout(() => {
                if (this.entradasPaginator && this.entradasSort) {
                  this.entradasDataSource.paginator = this.entradasPaginator;
                  this.entradasDataSource.sort = this.entradasSort;
                }
              });
            }
            
            if (this.item.salidas && this.item.salidas.length > 0) {
              this.salidasDataSource.data = this.item.salidas;
              setTimeout(() => {
                if (this.salidasPaginator && this.salidasSort) {
                  this.salidasDataSource.paginator = this.salidasPaginator;
                  this.salidasDataSource.sort = this.salidasSort;
                }
              });
            }
            
            // Construir historial de auditoría
            this.construirHistorialAuditoria();
          } else {
            this.error = 'No se encontró el item';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message || 'Error al cargar los detalles';
          this.isLoading = false;
        }
      });
  }

  construirHistorialAuditoria(): void {
    if (!this.item) return;
    
    this.historialAuditoria = [];
    
    // Agregar creación solo si existe información de creador
    if (this.item.creador && this.item.creador.fecha && this.item.creador.usuario) {
      this.historialAuditoria.push({
        tipo: 'CREACIÓN',
        fecha: this.item.creador.fecha,
        usuario: this.item.creador.usuario.username || 'Usuario desconocido',
        detalles: `Creación inicial del artículo`
      });
    }
    
    // Agregar última modificación si existe
    if (this.item.ultimaModificacion && this.item.ultimaModificacion.fecha && this.item.ultimaModificacion.usuario) {
      this.historialAuditoria.push({
        tipo: 'MODIFICACIÓN',
        fecha: this.item.ultimaModificacion.fecha,
        usuario: this.item.ultimaModificacion.usuario.username || 'Usuario desconocido',
        detalles: `Última modificación del artículo`
      });
    }
    
    // Agregar entradas
    if (this.item.entradas && this.item.entradas.length > 0) {
      this.item.entradas.forEach(entrada => {
        if (entrada && entrada.fecha && entrada.registradoPor && entrada.registradoPor.usuario) {
          let detalles = `Entrada de ${entrada.cantidad} unidades`;
          if (entrada.proveedor) {
            detalles += `. Proveedor: ${entrada.proveedor}`;
          }
          if (entrada.ubicacionAnterior && entrada.ubicacionNueva) {
            detalles += `. Cambio de ubicación: ${entrada.ubicacionAnterior.edificio}-A${entrada.ubicacionAnterior.anaquel}-N${entrada.ubicacionAnterior.nivel} → ${entrada.ubicacionNueva.edificio}-A${entrada.ubicacionNueva.anaquel}-N${entrada.ubicacionNueva.nivel}`;
          }
          
          this.historialAuditoria.push({
            tipo: 'ENTRADA',
            fecha: entrada.fecha,
            usuario: entrada.registradoPor.usuario.username || 'Usuario desconocido',
            detalles
          });
        }
      });
    }
    
    // Agregar salidas
    if (this.item.salidas && this.item.salidas.length > 0) {
      this.item.salidas.forEach(salida => {
        if (salida && salida.fecha && salida.registradoPor && salida.registradoPor.usuario) {
          this.historialAuditoria.push({
            tipo: 'SALIDA',
            fecha: salida.fecha,
            usuario: salida.registradoPor.usuario.username || 'Usuario desconocido',
            detalles: `Salida de ${salida.cantidad} unidades. Área: ${salida.area}. Solicitante: ${salida.solicitante}. Motivo: ${salida.motivo || 'No especificado'}`
          });
        }
      });
    }
    
    // Ordenar por fecha (más recientes primero)
    this.historialAuditoria.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  aplicarFiltroEntradas(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.entradasDataSource.filter = filterValue.trim().toLowerCase();

    if (this.entradasDataSource.paginator) {
      this.entradasDataSource.paginator.firstPage();
    }
  }

  aplicarFiltroSalidas(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.salidasDataSource.filter = filterValue.trim().toLowerCase();

    if (this.salidasDataSource.paginator) {
      this.salidasDataSource.paginator.firstPage();
    }
  }

  tabChange(index: number) {
    this.activeTabIndex = index;
    // Reinicializa los paginadores/ordenadores si hay cambio de tabs
    setTimeout(() => {
      if (this.activeTabIndex === 1 && this.entradasDataSource && this.entradasPaginator && this.entradasSort) {
        this.entradasDataSource.paginator = this.entradasPaginator;
        this.entradasDataSource.sort = this.entradasSort;
      } else if (this.activeTabIndex === 2 && this.salidasDataSource && this.salidasPaginator && this.salidasSort) {
        this.salidasDataSource.paginator = this.salidasPaginator;
        this.salidasDataSource.sort = this.salidasSort;
      }
    });
  }

  getStockStatus(): string {
    if (!this.item) return '';
    
    if (this.item.cantidad <= 0) {
      return 'agotado';
    } else if (this.item.cantidad <= this.item.stockMinimo!) {
      return 'critico';
    } else if (this.item.cantidad <= this.item.stockMinimo! * 2) {
      return 'bajo';
    } else {
      return 'optimo';
    }
  }

  getStockStatusText(): string {
    const status = this.getStockStatus();
    switch(status) {
      case 'agotado': return 'AGOTADO';
      case 'critico': return 'CRÍTICO';
      case 'bajo': return 'BAJO';
      case 'optimo': return 'ÓPTIMO';
      default: return '';
    }
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

  formatTipoMaterial(tipo: string): string {
    const formatMap: Record<string, string> = {
      'oficina': 'Material de Oficina',
      'limpieza': 'Material de Limpieza',
      'varios': 'Varios'
    };
    return formatMap[tipo] || tipo;
  }

  getUbicacionString(ubicacion?: Ubicacion): string {
    if (!ubicacion) return 'No disponible';
    const edificio = ubicacion.edificio === 'ADM' ? 'Administración' : 'Tecnologías de la Información';
    return `${edificio} - Anaquel ${ubicacion.anaquel} - Nivel ${ubicacion.nivel}`;
  }

  getTipoAuditoriaIcon(tipo: string): string {
    switch(tipo) {
      case 'CREACIÓN': return 'add_circle';
      case 'MODIFICACIÓN': return 'edit';
      case 'ENTRADA': return 'input';
      case 'SALIDA': return 'output';
      default: return 'info';
    }
  }

  getTipoAuditoriaClass(tipo: string): string {
    switch(tipo) {
      case 'CREACIÓN': return 'bg-green-100 text-green-800';
      case 'MODIFICACIÓN': return 'bg-blue-100 text-blue-800';
      case 'ENTRADA': return 'bg-purple-100 text-purple-800';
      case 'SALIDA': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  regresar(): void {
    this.location.back();
  }

  verResumenTicket(): void {
    // Preparar la vista para impresión
    const printSections = document.querySelectorAll('.mat-tab-body');
    printSections.forEach((section, index) => {
      (section as HTMLElement).style.display = index === this.activeTabIndex ? 'block' : 'none';
    });
    
    // Agregar encabezado de impresión
    const printHeader = document.createElement('div');
    printHeader.className = 'print-header';
    printHeader.innerHTML = `
      <h1>FICHA TÉCNICA DE INVENTARIO</h1>
      <div class="fecha">Fecha de impresión: ${new Date().toLocaleString()}</div>
    `;
    
    // Agregar pie de página de impresión
    const printFooter = document.createElement('div');
    printFooter.className = 'print-footer';
    printFooter.innerHTML = `
      Inventario CJ - Reporte generado el ${new Date().toLocaleString()}
    `;
    
    // Obtener el contenedor principal
    const container = document.querySelector('.print-content');
    container?.insertBefore(printHeader, container.firstChild);
    container?.appendChild(printFooter);
    
    // Imprimir la página
    setTimeout(() => {
      window.print();
      
      // Restaurar después de imprimir
      setTimeout(() => {
        container?.removeChild(printHeader);
        container?.removeChild(printFooter);
        
        // Restaurar visualización de tabs
        const printSections = document.querySelectorAll('.mat-tab-body');
        printSections.forEach((section) => {
          (section as HTMLElement).style.display = '';
        });
      }, 100);
    }, 100);
  }
}
