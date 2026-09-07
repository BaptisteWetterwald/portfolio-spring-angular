import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { LighthouseThemeToggleComponent } from '../lighthouse-theme-toggle/lighthouse-theme-toggle.component';
import { SonarNavigationComponent } from '../sonar-navigation/sonar-navigation.component';

@Component({
  selector: 'app-maritime-floating-controls',
  imports: [LighthouseThemeToggleComponent, SonarNavigationComponent],
  templateUrl: './maritime-floating-controls.component.html',
  styleUrl: './maritime-floating-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeFloatingControlsComponent {
  readonly sonarActive = input(false);

  protected readonly sonarFocused = signal(false);
  protected readonly sonarAvailable = computed(() => this.sonarActive() || this.sonarFocused());

  protected handleSonarFocusIn(): void {
    this.sonarFocused.set(true);
  }

  protected handleSonarFocusOut(event: FocusEvent): void {
    const sonar = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (sonar instanceof HTMLElement && nextTarget instanceof Node && sonar.contains(nextTarget)) {
      return;
    }

    this.sonarFocused.set(false);
  }
}
