import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  Injector,
  input,
  signal,
  ViewChild,
} from '@angular/core';

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
  @ViewChild(SonarNavigationComponent) private sonar?: SonarNavigationComponent;
  readonly #injector = inject(Injector);
  readonly #shortcutOpen = signal(false);
  #lastControlTap = -Infinity;
  #controlOnly = false;
  #previousFocus?: HTMLElement;
  readonly sonarActive = input(false);

  protected readonly sonarFocused = signal(false);
  protected readonly sonarAvailable = computed(
    () => this.sonarActive() || this.sonarFocused() || this.#shortcutOpen(),
  );

  @HostListener('document:keydown', ['$event'])
  protected handleShortcutKeyDown(event: KeyboardEvent): void {
    const editable =
      event.target instanceof Element &&
      event.target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
      );
    this.#controlOnly =
      event.key === 'Control' &&
      !event.repeat &&
      !event.altKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.isComposing &&
      !editable;
    if (!this.#controlOnly) this.#lastControlTap = -Infinity;
  }

  @HostListener('document:keyup', ['$event'])
  protected handleShortcutKeyUp(event: KeyboardEvent): void {
    if (event.key !== 'Control' || !this.#controlOnly) return;
    this.#controlOnly = false;
    const now = performance.now();
    if (now - this.#lastControlTap <= 450) {
      this.#lastControlTap = -Infinity;
      if (this.#shortcutOpen()) return;
      this.#previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      this.#shortcutOpen.set(true);
      afterNextRender(() => this.sonar?.openFromKeyboard(), { injector: this.#injector });
    } else {
      this.#lastControlTap = now;
    }
  }

  @HostListener('window:blur')
  protected resetShortcut(): void {
    this.#controlOnly = false;
    this.#lastControlTap = -Infinity;
  }

  protected handleSonarClosed(): void {
    if (!this.#shortcutOpen()) return;
    if (document.activeElement?.closest('app-sonar-navigation')) {
      this.#previousFocus?.focus({ preventScroll: true });
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.closest('app-sonar-navigation')
      ) {
        document.activeElement.blur();
      }
    }
    this.#shortcutOpen.set(false);
  }

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
