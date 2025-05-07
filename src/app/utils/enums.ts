/**
 * Define los tipos para las enumeraciones
 */
export type AreaKey = 
  'CONSEJERO_JURIDICO' | 
  'SECRETARIA_PARTICULAR' | 
  'DIRECCION_COORDINACION' | 
  'DIRECCION_CONTENCIOSO' | 
  'DIRECCION_ASISTENCIA' | 
  'DIRECCION_SERVICIOS' | 
  'DIRECCION_CONSULTIVA' | 
  'DIRECCION_ESTUDIOS_LEG' | 
  'DIRECCION_ESTUDIOS_JUR' | 
  'DIRECCION_COMPILACION' | 
  'DIRECCION_ADMINISTRATIVA' | 
  'UNIDAD_TRANSPARENCIA' | 
  'LIMPIEZA';

export type TipoMaterialKey = 'OFICINA' | 'LIMPIEZA' | 'VARIOS';

export type UnidadMedidaKey = 
  'PIEZA' | 
  'LITRO' | 
  'KILOGRAMO' | 
  'METRO' | 
  'GRAMO' | 
  'MILILITRO' | 
  'UNIDAD' | 
  'CAJA' | 
  'PAQUETE' | 
  'ROLLO' | 
  'OTRO';

/**
 * Áreas de la organización
 * @enum {string}
 */
export const AREAS: Record<AreaKey, string> = Object.freeze({
  CONSEJERO_JURIDICO: 'CONSEJERO JURÍDICO',
  SECRETARIA_PARTICULAR: 'SECRETARIA PARTICULAR Y DE COMUNICACIÓN SOCIAL',
  DIRECCION_COORDINACION: 'DIRECCIÓN DE COORDINACIÓN Y CONTROL DE GESTIÓN',
  DIRECCION_CONTENCIOSO: 'DIRECCIÓN GENERAL DE LO CONTENCIOSO',
  DIRECCION_ASISTENCIA: 'DIRECCIÓN DE ASISTENCIA TÉCNICA Y COMBATE A LA CORRUPCIÓN',
  DIRECCION_SERVICIOS: 'DIRECCIÓN DE SERVICIOS LEGALES',
  DIRECCION_CONSULTIVA: 'DIRECCIÓN GENERAL CONSULTIVA',
  DIRECCION_ESTUDIOS_LEG: 'DIRECCIÓN DE ESTUDIOS LEGISLATIVOS',
  DIRECCION_ESTUDIOS_JUR: 'DIRECCIÓN DE ESTUDIOS JURÍDICOS',
  DIRECCION_COMPILACION: 'DIRECCIÓN DE COMPILACIÓN NORMATIVA, ARCHIVO E IGUALDAD DE GÉNERO',
  DIRECCION_ADMINISTRATIVA: 'DIRECCIÓN ADMINISTRATIVA',
  UNIDAD_TRANSPARENCIA: 'UNIDAD DE TRANSPARENCIA',
  LIMPIEZA: 'LIMPIEZA'
});

/**
 * Tipos de material en inventario
 * @enum {string}
 */
export const TIPO_MATERIAL: Record<TipoMaterialKey, string> = Object.freeze({
  OFICINA: 'oficina',
  LIMPIEZA: 'limpieza',
  VARIOS: 'varios'
});

/**
 * Unidades de medida disponibles
 * @enum {string}
 */
export const UNIDAD_MEDIDA: Record<UnidadMedidaKey, string> = Object.freeze({
  PIEZA: 'pieza',
  LITRO: 'litro',
  KILOGRAMO: 'kilogramo',
  METRO: 'metro',
  GRAMO: 'gramo',
  MILILITRO: 'mililitro',
  UNIDAD: 'unidad',
  CAJA: 'caja',
  PAQUETE: 'paquete',
  ROLLO: 'rollo',
  OTRO: 'otro'
});

/**
 * Helper para obtener arrays de valores
 */
export const getAreaValues = (): string[] => Object.values(AREAS);
export const getTipoMaterialValues = (): string[] => Object.values(TIPO_MATERIAL);
export const getUnidadMedidaValues = (): string[] => Object.values(UNIDAD_MEDIDA);