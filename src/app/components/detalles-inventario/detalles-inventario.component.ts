import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, Input } from '@angular/core';
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
export class DetallesInventarioComponent implements OnInit, OnDestroy, OnChanges {
  @Input() itemId?: string;
  item: Inventario | null = null;
  isLoading = true;
  error = '';
  
  // Entradas configuración
  displayedColumnsEntradas = ['fecha', 'cantidad', 'proveedor', 'registradoPor'];
  entradasDataSource = new MatTableDataSource<Entrada>([]);
  @ViewChild('entradasPaginator') entradasPaginator!: MatPaginator;
  @ViewChild('entradasSort') entradasSort!: MatSort;
  
  // Salidas configuración
  displayedColumnsSalidas = ['fecha', 'cantidad', 'area', 'solicitante', 'registradoPor'];
  salidasDataSource = new MatTableDataSource<Salida>([]);
  @ViewChild('salidasPaginator') salidasPaginator!: MatPaginator;
  @ViewChild('salidasSort') salidasSort!: MatSort;
  
  // Auditoria configuración
  historialAuditoria: any[] = [];
  
  // Tabs de control
  activeTabIndex = 0;
  
  private destroy$ = new Subject<void>();

  // Agregar propiedades de paginación y ordenación
  entradasTotalItems = 0;
  salidasTotalItems = 0;
  entradasCurrentPage = 0;
  salidasCurrentPage = 0;
  entradasPageSize = 10;
  salidasPageSize = 10;
  entradasSortActive = 'fecha';
  entradasSortDirection = 'desc';
  salidasSortActive = 'fecha';
  salidasSortDirection = 'desc';
  entradasFilterValue = '';
  salidasFilterValue = '';

  // Agregar propiedades para controlar el estado de carga
  entradasLoading = false;
  salidasLoading = false;

  // Añadir propiedades para paginación del historial
  auditoriaTotalItems = 0;
  auditoriaCurrentPage = 0;
  auditoriaPageSize = 10;
  auditoriaFiltrada: any[] = [];

  // Añadir propiedad para filtros por período
  periodoFiltro: 'todos' | 'hoy' | 'semana' | 'mes' = 'todos';

  constructor(
    private inventarioService: InventarioService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  // Modificar el método ngOnInit para cargar solo los datos básicos del inventario
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalles(id);
      // Cargar datos inmediatamente
      this.cargarEntradas(id);
      this.cargarSalidas(id);
    } else {
      this.error = 'ID no proporcionado';
      this.isLoading = false;
    }
  }

  ngAfterViewInit() {
    // Configurar paginador para entradas
    if (this.entradasPaginator) {
      this.entradasPaginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe(page => {
        this.entradasCurrentPage = page.pageIndex;
        this.entradasPageSize = page.pageSize;
        this.cargarEntradas(this.item?._id || '');
      });
    }
    
    // Configurar ordenador para entradas
    if (this.entradasSort) {
      this.entradasSort.sortChange.pipe(
        takeUntil(this.destroy$)
      ).subscribe(sort => {
        this.entradasSortActive = sort.active;
        this.entradasSortDirection = sort.direction || 'asc';
        this.entradasCurrentPage = 0; // Reiniciar a primera página al ordenar
        if (this.entradasPaginator) {
          this.entradasPaginator.pageIndex = 0;
        }
        this.cargarEntradas(this.item?._id || '');
      });
    }
    
    // Configurar paginador para salidas
    if (this.salidasPaginator) {
      this.salidasPaginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe(page => {
        this.salidasCurrentPage = page.pageIndex;
        this.salidasPageSize = page.pageSize;
        this.cargarSalidas(this.item?._id || '');
      });
    }
    
    // Configurar ordenador para salidas
    if (this.salidasSort) {
      this.salidasSort.sortChange.pipe(
        takeUntil(this.destroy$)
      ).subscribe(sort => {
        this.salidasSortActive = sort.active;
        this.salidasSortDirection = sort.direction || 'asc';
        this.salidasCurrentPage = 0; // Reiniciar a primera página al ordenar
        if (this.salidasPaginator) {
          this.salidasPaginator.pageIndex = 0;
        }
        this.cargarSalidas(this.item?._id || '');
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemId'] && !changes['itemId'].firstChange) {
      if (this.itemId) {
        this.cargarDetalles(this.itemId);
        // Resetear las tablas
        this.entradasDataSource.data = [];
        this.salidasDataSource.data = [];
        this.entradasCurrentPage = 0;
        this.salidasCurrentPage = 0;
        
        // Si la pestaña activa es de entradas o salidas, cargar los datos
        if (this.activeTabIndex === 1) {
          this.cargarEntradas(this.itemId);
        } else if (this.activeTabIndex === 2) {
          this.cargarSalidas(this.itemId);
        }
      }
    }
  }

  // Modificar el método cargarDetalles para que solo cargue la información básica
  cargarDetalles(id: string): void {
    this.inventarioService.getInventarioById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'success' && response.data) {
            this.item = response.data;
            
            // Construir historial de auditoría
            this.construirHistorialAuditoria();
            
            // Inicializar tablas vacías para luego cargarlas según demanda
            this.entradasDataSource.data = [];
            this.salidasDataSource.data = [];
            
            // Configurar paginadores y ordenadores en AfterViewInit
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

  // Método para cargar entradas con paginación
  cargarEntradas(id: string): void {
    if (!id) return;
    
    this.entradasLoading = true;
    
    this.inventarioService.getEntradasPaginadas(id, {
      page: this.entradasCurrentPage,
      pageSize: this.entradasPageSize,
      sortField: this.entradasSortActive,
      sortOrder: this.entradasSortDirection as 'asc' | 'desc',
      search: this.entradasFilterValue
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.entradasDataSource.data = response.data;
          this.entradasTotalItems = response.total;
          this.entradasLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar entradas:', error);
          this.entradasLoading = false;
        }
      });
  }

  // Método para cargar salidas con paginación
  cargarSalidas(id: string): void {
    if (!id) return;
    
    this.salidasLoading = true;
    
    this.inventarioService.getSalidasPaginadas(id, {
      page: this.salidasCurrentPage,
      pageSize: this.salidasPageSize,
      sortField: this.salidasSortActive,
      sortOrder: this.salidasSortDirection as 'asc' | 'desc',
      search: this.salidasFilterValue
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.salidasDataSource.data = response.data;
          this.salidasTotalItems = response.total;
          this.salidasLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar salidas:', error);
          this.salidasLoading = false;
        }
      });
  }

  // Método para agrupar por fechas
  agruparHistorialPorFecha(): { fecha: string, eventos: any[] }[] {
    const grupos: { [key: string]: any[] } = {};
    
    // Agrupar por fecha (solo día)
    this.auditoriaFiltrada.forEach(evento => {
      const fecha = new Date(evento.fecha).toISOString().split('T')[0];
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(evento);
    });
    
    // Convertir a array ordenado por fecha (más recientes primero)
    return Object.keys(grupos)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => {
        return {
          fecha: fecha,
          eventos: grupos[fecha]
        };
      });
  }

  // Método para filtrar el historial por período
  filtrarHistorialPorPeriodo(periodo: 'todos' | 'hoy' | 'semana' | 'mes'): void {
    this.periodoFiltro = periodo;
    
    const ahora = new Date();
    let fechaLimite = new Date();
    
    switch (periodo) {
      case 'hoy':
        fechaLimite.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        break;
      case 'mes':
        fechaLimite.setMonth(fechaLimite.getMonth() - 1);
        break;
      default:
        // No filtrar por fecha, mostrar todos
        this.auditoriaFiltrada = [...this.historialAuditoria];
        this.auditoriaTotalItems = this.historialAuditoria.length;
        this.paginarHistorial();
        return;
    }
    
    // Filtrar eventos por fecha
    const eventosFiltrados = this.historialAuditoria.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento >= fechaLimite;
    });
    
    this.auditoriaFiltrada = eventosFiltrados;
    this.auditoriaTotalItems = eventosFiltrados.length;
    this.auditoriaCurrentPage = 0;
    this.paginarHistorial();
  }

  // Método para paginar el historial
  paginarHistorial(): void {
    const start = this.auditoriaCurrentPage * this.auditoriaPageSize;
    const end = start + this.auditoriaPageSize;
    
    // No modificamos this.auditoriaFiltrada aquí para mantener el conjunto completo
    // para la agrupación por fecha, solo aplicamos paginación al mostrar los elementos
  }

  // Método para cambiar página
  cambiarPaginaHistorial(event: any): void {
    this.auditoriaCurrentPage = event.pageIndex;
    this.auditoriaPageSize = event.pageSize;
    this.paginarHistorial();
  }

  // Sobrescribir el método construirHistorialAuditoria
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
    
    // Inicializar filtro y paginación
    this.filtrarHistorialPorPeriodo('todos');
  }

  // Modificar el método de filtrado para entradas
  aplicarFiltroEntradas(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.entradasFilterValue = filterValue.trim().toLowerCase();
    this.entradasCurrentPage = 0; // Reiniciar a primera página al filtrar
    
    if (this.entradasPaginator) {
      this.entradasPaginator.pageIndex = 0;
    }
    
    this.cargarEntradas(this.item?._id || '');
  }

  // Modificar el método de filtrado para salidas
  aplicarFiltroSalidas(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.salidasFilterValue = filterValue.trim().toLowerCase();
    this.salidasCurrentPage = 0; // Reiniciar a primera página al filtrar
    
    if (this.salidasPaginator) {
      this.salidasPaginator.pageIndex = 0;
    }
    
    this.cargarSalidas(this.item?._id || '');
  }

  // Modificación del método tabChange
  tabChange(index: number) {
    // Si estamos cambiando a la misma pestaña, no hacemos nada
    if (this.activeTabIndex === index) return;
    
    this.activeTabIndex = index;
    
    // Forzar la carga de datos independientemente de si ya hay datos
    if (this.activeTabIndex === 1) {
      // Tab de entradas
      this.cargarEntradas(this.item?._id || '');
    } else if (this.activeTabIndex === 2) {
      // Tab de salidas
      this.cargarSalidas(this.item?._id || '');
    }
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

  // Métodos para limpiar filtros
  limpiarFiltroEntradas(): void {
    this.entradasFilterValue = '';
    if (this.entradasPaginator) {
      this.entradasPaginator.pageIndex = 0;
    }
    this.entradasCurrentPage = 0;
    this.cargarEntradas(this.item?._id || '');
    
    // Limpiar el campo de búsqueda
    const inputElement = document.querySelector('#inputEntradas') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }

  limpiarFiltroSalidas(): void {
    this.salidasFilterValue = '';
    if (this.salidasPaginator) {
      this.salidasPaginator.pageIndex = 0;
    }
    this.salidasCurrentPage = 0;
    this.cargarSalidas(this.item?._id || '');
    
    // Limpiar el campo de búsqueda
    const inputElement = document.querySelector('#inputSalidas') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }
}
