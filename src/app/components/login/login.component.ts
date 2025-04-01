import { AuthService } from './../../core/services/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // Agrega FormsModule a los imports
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  usuario = {
    username: '',
    password: ''
  };
  errorMessage: string = ''; // Variable para almacenar el mensaje de error

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    this.authService.login(this.usuario).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        if (response && response.token) { // Verificar que la respuesta y el token existan
          localStorage.setItem('token', response.token); // Almacenar el token en el localStorage
          this.router.navigate(['/inventario']);
        } else {
          this.errorMessage = 'Credenciales inválidas. Por favor, inténtalo de nuevo.';
        }
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.'; // Mensaje de error genérico
      }
    });
  }
}
