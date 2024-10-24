import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarritoService } from '../../../../shared/services/carrito.service';
import { Producto } from '../../../../shared/models/producto';
import { ProductoService } from '../../../../shared/services/producto.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  productos: Producto[] = [];
  total: number = 0;
  cantidades: { [key: string]: number } = {};

  constructor(
    private http: HttpClient,
    private carritoService: CarritoService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarProductosDelCarrito();
  }

  cargarProductosDelCarrito(): void {
    const carritoIds = this.carritoService.getCarritoIds();
    const productRequests = carritoIds.map(id =>
      this.productoService.getProductoById(id).toPromise()
    );

    Promise.all(productRequests)
      .then(productos => {
        this.productos = productos.filter((producto): producto is Producto => producto !== undefined);
        this.cargarCantidadesDesdeStorage();
        this.calcularTotal();
      })
      .catch(() => {
        console.error('Error al cargar los productos en la página de pago.');
      });
  }

  cargarCantidadesDesdeStorage(): void {
    const cantidadesGuardadas = localStorage.getItem('cantidades');
    if (cantidadesGuardadas) {
      this.cantidades = JSON.parse(cantidadesGuardadas);
    }
  }

  calcularTotal(): void {
    this.total = this.productos.reduce((total, producto) => {
      const cantidad = this.cantidades[producto.idProducto.toString()] || 1;
      return total + (producto.precioOferta || producto.precio) * cantidad;
    }, 0);
  }

  createPayment(event: Event) {
    event.preventDefault(); // Evita el comportamiento predeterminado del formulario
  
    // Asegúrate de que solo envías un producto por vez, elige uno o suma todos
    const paymentData = {
      ItemTitle: this.productos[0].productoNombre, // Usa el primer producto como ejemplo
      ItemPrice: this.productos[0].precioOferta || this.productos[0].precio, // Usa el precio correcto
      ItemQuantity: this.cantidades[this.productos[0].idProducto.toString()] || 1 // Usa la cantidad correcta
    };
  
    // Depuración
    console.log('Datos de pago a enviar:', paymentData);
  
    // Llama a tu backend para crear la preferencia de pago
    this.http.post('http://localhost:5251/api/store/payments/create-preference', paymentData)
      .subscribe((response: any) => {
        // Redirige al usuario a la URL de inicio de pago
        window.location.href = response.initPoint; // Usar el initPoint de la respuesta
      }, error => {
        console.error('Error al crear la preferencia de pago:', error);
      });
    }}
