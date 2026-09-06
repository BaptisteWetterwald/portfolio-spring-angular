import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { LighthouseThemeToggleComponent } from '../lighthouse-theme-toggle/lighthouse-theme-toggle.component';
import { MaritimeNavigationMode } from '../maritime-navigation-shell/navigation-mode';
import { SonarNavigationComponent } from '../sonar-navigation/sonar-navigation.component';

@Component({
  selector: 'app-maritime-floating-controls',
  imports: [LighthouseThemeToggleComponent, SonarNavigationComponent],
  templateUrl: './maritime-floating-controls.component.html',
  styleUrl: './maritime-floating-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeFloatingControlsComponent {
  readonly navigationMode = input<MaritimeNavigationMode>('top');

  protected readonly isFloating = computed(() => this.navigationMode() === 'floating');
}
