import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const brandAssets = {
  github: { light: '/assets/brands/github-black.svg', dark: '/assets/brands/github-white.svg' },
  linkedin: {
    light: '/assets/brands/linkedin-blue.png',
    dark: '/assets/brands/linkedin-white.png',
  },
} as const;

@Component({
  selector: 'app-brand-icon',
  template: `
    <img class="brand-icon__light" [src]="assets().light" width="20" height="20" alt="" />
    <img class="brand-icon__dark" [src]="assets().dark" width="20" height="20" alt="" />
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 20px;
      height: 20px;
      flex: 0 0 20px;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .brand-icon__dark {
      display: none;
    }
    :host-context([data-theme='dark']) .brand-icon__light {
      display: none;
    }
    :host-context([data-theme='dark']) .brand-icon__dark {
      display: block;
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandIconComponent {
  readonly brand = input.required<keyof typeof brandAssets>();
  protected readonly assets = computed(() => brandAssets[this.brand()]);
}
