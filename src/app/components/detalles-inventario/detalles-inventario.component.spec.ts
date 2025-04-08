import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesInventarioComponent } from './detalles-inventario.component';

describe('DetallesInventarioComponent', () => {
  let component: DetallesInventarioComponent;
  let fixture: ComponentFixture<DetallesInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesInventarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
