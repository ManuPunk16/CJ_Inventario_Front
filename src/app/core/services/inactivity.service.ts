import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private readonly INACTIVITY_TIMEOUT = 3600000; // 1 hora en milisegundos
  private timeoutId: any;

  constructor(private authService: AuthService, private router: Router) {}

  startWatching() {
    this.resetTimer();
    // Eventos a monitorear
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer());
    });
  }

  private resetTimer() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      // El logout ahora maneja la redirección internamente
      this.authService.logout();
    }, this.INACTIVITY_TIMEOUT);
  }

  stopWatching() {
    clearTimeout(this.timeoutId);
  }
}
