import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  usuario = {
    username: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  register(): void {
    this.authService.register(this.usuario).subscribe({
      next: (response) => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al registrarse:', error);
      }
    });
  }
}
