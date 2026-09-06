import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LighthouseThemeToggleComponent } from '../lighthouse-theme-toggle/lighthouse-theme-toggle.component';
import { SonarNavigationComponent } from '../sonar-navigation/sonar-navigation.component';

@Component({
  selector: 'app-maritime-floating-controls',
  imports: [LighthouseThemeToggleComponent, SonarNavigationComponent],
  templateUrl: './maritime-floating-controls.component.html',
  styleUrl: './maritime-floating-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeFloatingControlsComponent {}
