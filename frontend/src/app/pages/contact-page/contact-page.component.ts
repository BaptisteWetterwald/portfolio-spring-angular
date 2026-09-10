import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ContactApiService } from '../../core/contact/contact-api.service';
import { LocaleContextService } from '../../core/i18n/locale-context.service';
import { defaultLocale, toSupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { SectionPermalinkComponent } from '../../shared/section-permalink/section-permalink.component';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, SectionPermalinkComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {
  readonly #contactApi = inject(ContactApiService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #formBuilder = inject(NonNullableFormBuilder);
  readonly #route = inject(ActivatedRoute);
  readonly #localeContext = inject(LocaleContextService);
  readonly #translations = inject(TranslationService);

  protected readonly locale =
    toSupportedLocale(this.#route.parent?.snapshot.data['locale']) ?? defaultLocale;
  protected readonly submissionState = signal<ContactSubmissionState>('idle');
  protected readonly form = this.#formBuilder.group({
    name: this.#formBuilder.control('', [
      Validators.required,
      Validators.maxLength(100),
      singleLineValidator,
    ]),
    email: this.#formBuilder.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(254),
      singleLineValidator,
    ]),
    subject: this.#formBuilder.control('', [
      Validators.required,
      Validators.maxLength(160),
      singleLineValidator,
    ]),
    message: this.#formBuilder.control('', [
      Validators.required,
      Validators.minLength(20),
      Validators.maxLength(5000),
      noNullValidator,
    ]),
    organizationWebsite: this.#formBuilder.control('', [
      Validators.maxLength(200),
      singleLineValidator,
    ]),
  });

  constructor() {
    this.#localeContext.setLocale(this.locale);
  }

  protected t(key: string): string {
    return this.#translations.translate(key);
  }

  protected submit(): void {
    if (this.submissionState() === 'submitting') {
      return;
    }

    this.#normalizeForm();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submissionState.set('invalid');
      return;
    }

    this.submissionState.set('submitting');
    this.#contactApi
      .submit(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.form.reset();
          this.submissionState.set('success');
        },
        error: (error: unknown) => {
          this.submissionState.set(
            error instanceof HttpErrorResponse && error.status === 429 ? 'rate-limited' : 'failure',
          );
        },
      });
  }

  protected clearStatusOnInput(): void {
    if (this.submissionState() !== 'submitting') {
      this.submissionState.set('idle');
    }
  }

  protected showError(control: FormControl<string>): boolean {
    return control.invalid && (control.touched || this.submissionState() === 'invalid');
  }

  protected errorMessage(field: ContactField): string {
    const control = this.form.controls[field];

    if (control.hasError('required')) {
      return this.t(`contact.validation.${field}Required`);
    }
    if (control.hasError('email')) {
      return this.t('contact.validation.emailInvalid');
    }
    if (control.hasError('minlength')) {
      return this.t('contact.validation.messageMin');
    }

    return this.t(`contact.validation.${field}Max`);
  }

  protected statusMessage(): string {
    switch (this.submissionState()) {
      case 'invalid':
        return this.t('contact.status.invalid');
      case 'submitting':
        return this.t('contact.status.submitting');
      case 'success':
        return this.t('contact.status.success');
      case 'rate-limited':
        return this.t('contact.status.rateLimited');
      case 'failure':
        return this.t('contact.status.failure');
      default:
        return '';
    }
  }

  #normalizeForm(): void {
    const controls = this.form.controls;

    controls.name.setValue(controls.name.value.trim());
    controls.email.setValue(controls.email.value.trim());
    controls.subject.setValue(controls.subject.value.trim());
    controls.message.setValue(controls.message.value.replace(/\r\n?/gu, '\n').trim());
    controls.organizationWebsite.setValue(controls.organizationWebsite.value.trim());
  }
}

type ContactSubmissionState =
  'idle' | 'invalid' | 'submitting' | 'success' | 'rate-limited' | 'failure';

type ContactField = 'name' | 'email' | 'subject' | 'message';

const singleLineValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && /[\r\n\0]/u.test(control.value)
    ? { invalidCharacters: true }
    : null;

const noNullValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.includes('\0')
    ? { invalidCharacters: true }
    : null;
