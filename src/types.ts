export interface Producto {
  codigo: string;
  descripcion: string;
  precio: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  productos: Producto[];
}

export interface MiProducto {
  codigoRef: string;
  codigoProv: string;
  descripcion: string;
  precioCosto: number;
  margen: string | number;
  proveedor: string;
  divisor?: number;
}

export interface StockItem {
  inicial: number;
  entradas: number;
  salidas: number;
  minimo: number;
}

export interface VentaItem {
  codigoRef: string;
  descripcion: string;
  cantidad: number;
  precioVenta: number;
}

export interface Venta {
  id: string;
  fecha: string;
  hora: string;
  items: VentaItem[];
  total: number;
  paymentMethod?: 'transferencia' | 'efectivo';
  amountReceived?: number;
  change?: number;
  clienteNombre?: string;
  clienteCelular?: string;
  clienteDireccion?: string;
}

export interface PedidoItem {
  codigoRef: string;
  codigoProv: string;
  descripcion: string;
  cantidad: number;
  proveedor: string;
  precioCosto: number;
  cantRecibida?: number | null;
}

export interface Orden {
  id: number;
  proveedor: string;
  items: PedidoItem[];
  estado: 'enviado' | 'recibido';
  fechaEnviado: string;
  horaEnviado: string;
  fechaRecibido?: string;
  totalEstimado: number;
}

export interface Margenes {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
}

export interface AppData {
  proveedores: Proveedor[];
  misProductos: MiProducto[];
  margenes: Margenes;
  stock: Record<string, StockItem>;
  ventas: Venta[];
  fotos: Record<string, string>;
  pedidos: PedidoItem[];
  pedidosHistorial: Orden[];
}

export type TabId = 'calc' | 'proveedores' | 'precios' | 'stock' | 'ventas' | 'pedidos' | 'presupuestos' | 'config';

export interface Toast {
  msg: string;
  type: 'success' | 'error' | 'info';
}
