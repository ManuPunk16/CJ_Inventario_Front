export interface Usuario {
  id: string;
  username: string;
}

export interface Ubicacion {
  anaquel: string;
  nivel: number;
  observaciones?: string;
}

export interface Entrada {
  fecha: Date;
  cantidad: number;
  proveedor?: string;
  ubicacionAnterior?: Ubicacion;
  ubicacionNueva?: Ubicacion;
}

export interface Salida {
  fecha: Date;
  hora: string;
  cantidad: number;
  motivo?: string;
  area: AreaTipo;
  solicitante: string;
  quienEntrega: string;
}

export type TipoMaterial = 'oficina' | 'limpieza' | 'varios';

export type UnidadMedida =
  'pieza' |
  'litro' |
  'kilogramo' |
  'metro' |
  'gramo' |
  'mililitro' |
  'unidad' |
  'caja' |
  'paquete' |
  'rollo' |
  'otro';

export type AreaTipo =
  'CONSEJERO JURÍDICO' |
  'SECRETARIA PARTICULAR Y DE COMUNICACIÓN SOCIAL' |
  'DIRECCIÓN DE COORDINACIÓN Y CONTROL DE GESTIÓN' |
  'DIRECCIÓN GENERAL DE LO CONTENCIOSO' |
  'DIRECCIÓN DE ASISTENCIA TÉCNICA Y COMBATE A LA CORRUPCIÓN' |
  'DIRECCIÓN DE SERVICIOS LEGALES' |
  'DIRECCIÓN GENERAL CONSULTIVA' |
  'DIRECCIÓN DE ESTUDIOS LEGISLATIVOS' |
  'DIRECCIÓN DE ESTUDIOS JURÍDICOS' |
  'DIRECCIÓN DE COMPILACIÓN NORMATIVA, ARCHIVO E IGUALDAD DE GÉNERO' |
  'DIRECCIÓN ADMINISTRATIVA' |
  'UNIDAD DE TRANSPARENCIA';

export interface Inventario {
  _id?: string;
  tipoMaterial: TipoMaterial;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  unidadMedida: UnidadMedida;
  precioUnitario: number;
  stockMinimo: number;
  ubicacion: Ubicacion;
  codigoUbicacion: string;
  entradas: Entrada[];
  salidas: Salida[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Interfaces para las respuestas de la API
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface InventarioResponse extends ApiResponse<Inventario> {
  data: Inventario;
}

export interface InventariosResponse extends ApiResponse<Inventario[]> {
  data: Inventario[];
  totalItems?: number;
  page?: number;
  totalPages?: number;
}
