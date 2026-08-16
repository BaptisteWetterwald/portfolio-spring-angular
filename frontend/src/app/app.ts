import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BackendHealthService } from './core/api/backend-health.service';

type BackendConnectionState = 'pending' | 'checking' | 'available' | 'unavailable';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly backendConnectionState = signal<BackendConnectionState>('pending');
  readonly backendConnectionMessage = signal('Backend check will run in the browser.');

  readonly #backendHealth = inject(BackendHealthService);
  readonly #platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    this.backendConnectionState.set('checking');
    this.backendConnectionMessage.set('Checking backend health...');

    this.#backendHealth.getHealth().subscribe({
      next: (health) => {
        this.backendConnectionState.set(health.status === 'UP' ? 'available' : 'unavailable');
        this.backendConnectionMessage.set(`Backend health: ${health.status}`);
      },
      error: () => {
        this.backendConnectionState.set('unavailable');
        this.backendConnectionMessage.set('Backend health check failed');
      },
    });
  }
}
