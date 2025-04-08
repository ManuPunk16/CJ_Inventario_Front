import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Inventario } from '../../core/models/inventario.model';
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
    DatePipe,
    MatProgressSpinnerModule
  ],
  templateUrl: './detalles-inventario.component.html'
})
export class DetallesInventarioComponent implements OnInit, OnDestroy {
  item: Inventario | null = null;
  isLoading = true;
  error = '';
  displayedColumnsEntradas = ['fecha', 'cantidad', 'proveedor'];
  displayedColumnsSalidas = ['fecha', 'cantidad', 'area', 'solicitante'];
  private destroy$ = new Subject<void>();

  constructor(
    private inventarioService: InventarioService,
    private route: ActivatedRoute,
    private router: Router
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

  regresar(): void {
    this.router.navigate(['/inventario']);
  }
}
