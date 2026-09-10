import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';

import { ContactApiService } from '../../core/contact/contact-api.service';
import { ContactRequest } from '../../core/contact/contact.models';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the English form labels and appropriate field attributes', async () => {
    const { fixture } = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h2')?.textContent).toContain('Contact');
    expect(labelText(page, 'contact-name')).toBe('Name');
    expect(labelText(page, 'contact-email')).toBe('Email');
    expect(labelText(page, 'contact-subject')).toBe('Subject');
    expect(labelText(page, 'contact-message')).toBe('Message');
    expect(page.querySelector<HTMLInputElement>('#contact-name')?.autocomplete).toBe('name');
    expect(page.querySelector<HTMLInputElement>('#contact-email')?.type).toBe('email');
    expect(page.querySelector<HTMLInputElement>('#contact-email')?.autocomplete).toBe('email');
    expect(page.querySelector('button[type="submit"]')?.textContent).toContain('Send message');
  });

  it('renders the preferred French labels and feedback copy', async () => {
    const { fixture } = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(labelText(page, 'contact-name')).toBe('Nom');
    expect(labelText(page, 'contact-email')).toBe('E-mail');
    expect(labelText(page, 'contact-subject')).toBe('Sujet');
    expect(labelText(page, 'contact-message')).toBe('Message');
    expect(page.querySelector('button[type="submit"]')?.textContent).toContain(
      'Envoyer le message',
    );
  });

  it('does not show errors before interaction and associates submitted errors with fields', async () => {
    const { fixture, api } = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.validator-hint')).toBeNull();

    await submitForm(fixture);

    const name = requiredElement<HTMLInputElement>(page, '#contact-name');
    const message = requiredElement<HTMLTextAreaElement>(page, '#contact-message');

    expect(api.submit).not.toHaveBeenCalled();
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(name.getAttribute('aria-describedby')).toBe('contact-name-error');
    expect(page.querySelector('#contact-name-error')?.textContent).toContain('Enter your name.');
    expect(message.getAttribute('aria-describedby')).toBe('contact-message-error');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Please review the highlighted fields.',
    );
  });

  it('validates trimmed lengths and email format before submission', async () => {
    const { fixture, api } = await createFixture('en');

    setValue(fixture, '#contact-name', ' Ada ');
    setValue(fixture, '#contact-email', 'not-an-email');
    setValue(fixture, '#contact-subject', ' Project ');
    setValue(fixture, '#contact-message', '  too short  ');
    await submitForm(fixture);

    const page = fixture.nativeElement as HTMLElement;

    expect(api.submit).not.toHaveBeenCalled();
    expect(page.querySelector('#contact-email-error')?.textContent).toContain(
      'Enter a valid email address.',
    );
    expect(page.querySelector('#contact-message-error')?.textContent).toContain(
      'at least 20 characters',
    );
  });

  it('submits one normalized payload and disables duplicate submission while pending', async () => {
    const response = new Subject<void>();
    const { fixture, api } = await createFixture('en', response);

    fillValidForm(fixture);
    await submitForm(fixture);
    await submitForm(fixture);

    const page = fixture.nativeElement as HTMLElement;
    const button = requiredElement<HTMLButtonElement>(page, 'button[type="submit"]');

    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.submit).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.test',
      subject: 'Project conversation',
      message: 'I would like to discuss a software project with you.',
      organizationWebsite: '',
    });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Sending…');
    expect(page.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('shows success and resets the complete form after backend acceptance', async () => {
    const response = new Subject<void>();
    const { fixture } = await createFixture('en', response);

    fillValidForm(fixture);
    setValue(fixture, '#contact-organization-website', '');
    await submitForm(fixture);

    response.next();
    response.complete();
    await settle(fixture);

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Your message has been sent.',
    );
    expect(valueOf(page, '#contact-name')).toBe('');
    expect(valueOf(page, '#contact-email')).toBe('');
    expect(valueOf(page, '#contact-subject')).toBe('');
    expect(valueOf(page, '#contact-message')).toBe('');
    expect(page.querySelector('.validator-hint')).toBeNull();
  });

  it('preserves every visible field and shows generic feedback after server failure', async () => {
    const response = new Subject<void>();
    const { fixture } = await createFixture('en', response);

    fillValidForm(fixture);
    await submitForm(fixture);

    response.error(new HttpErrorResponse({ status: 502 }));
    await settle(fixture);

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Your message could not be sent.',
    );
    expect(valueOf(page, '#contact-name')).toBe('Ada Lovelace');
    expect(valueOf(page, '#contact-email')).toBe('ada@example.test');
    expect(valueOf(page, '#contact-subject')).toBe('Project conversation');
    expect(valueOf(page, '#contact-message')).toContain('software project');
  });

  it('distinguishes rate limiting from a generic server failure', async () => {
    const response = new Subject<void>();
    const { fixture } = await createFixture('fr', response);

    fillValidForm(fixture);
    await submitForm(fixture);

    response.error(new HttpErrorResponse({ status: 429 }));
    await settle(fixture);

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.alert-warning[role="alert"]')?.textContent).toContain(
      'Trop de tentatives',
    );
    expect(valueOf(page, '#contact-message')).toContain('software project');
  });

  it('keeps the decoy field outside navigation and assistive-technology flow', async () => {
    const { fixture } = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const verification = requiredElement<HTMLElement>(page, '.contact-page__verification');
    const decoy = requiredElement<HTMLInputElement>(page, '#contact-organization-website');

    expect(verification.getAttribute('aria-hidden')).toBe('true');
    expect(decoy.tabIndex).toBe(-1);
    expect(decoy.autocomplete).toBe('off');
  });

  it('exposes the stable contact section anchor and daisyUI form foundations', async () => {
    const { fixture } = await createFixture('fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#contact');
    const permalink = section?.querySelector<HTMLAnchorElement>('[data-section-permalink]');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('contact-title');
    expect(section?.querySelector('h2')?.id).toBe('contact-title');
    expect(permalink?.getAttribute('href')).toBe('/fr#contact');
    expect(section?.querySelector('.card.card-border')).not.toBeNull();
    expect(section?.querySelectorAll('.fieldset')).toHaveLength(4);
    expect(section?.querySelector('.input.validator')).not.toBeNull();
    expect(section?.querySelector('.textarea.validator')).not.toBeNull();
    expect(section?.querySelector('.btn.btn-primary')).not.toBeNull();
  });
});

interface ContactApiStub {
  readonly submit: ReturnType<typeof vi.fn<(request: ContactRequest) => Observable<void>>>;
}

async function createFixture(
  locale: 'fr' | 'en',
  response: Observable<void> = new Subject<void>(),
): Promise<{ fixture: ComponentFixture<ContactPageComponent>; api: ContactApiStub }> {
  const api: ContactApiStub = {
    submit: vi.fn(() => response),
  };

  await TestBed.configureTestingModule({
    imports: [ContactPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          parent: {
            snapshot: {
              data: { locale },
            },
          },
        },
      },
      {
        provide: PageMetadataService,
        useValue: { applyStaticPage: vi.fn() },
      },
      { provide: ContactApiService, useValue: api },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ContactPageComponent);

  await settle(fixture);

  return { fixture, api };
}

function fillValidForm(fixture: ComponentFixture<ContactPageComponent>): void {
  setValue(fixture, '#contact-name', '  Ada Lovelace  ');
  setValue(fixture, '#contact-email', '  ada@example.test  ');
  setValue(fixture, '#contact-subject', '  Project conversation  ');
  setValue(fixture, '#contact-message', '  I would like to discuss a software project with you.  ');
}

function setValue(
  fixture: ComponentFixture<ContactPageComponent>,
  selector: string,
  value: string,
): void {
  const element = requiredElement<HTMLInputElement | HTMLTextAreaElement>(
    fixture.nativeElement as HTMLElement,
    selector,
  );

  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

async function submitForm(fixture: ComponentFixture<ContactPageComponent>): Promise<void> {
  const form = requiredElement<HTMLFormElement>(fixture.nativeElement as HTMLElement, 'form');

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await settle(fixture);
}

async function settle(fixture: ComponentFixture<ContactPageComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function labelText(page: HTMLElement, fieldId: string): string {
  return page.querySelector(`label[for="${fieldId}"]`)?.textContent?.trim() ?? '';
}

function valueOf(page: HTMLElement, selector: string): string {
  return requiredElement<HTMLInputElement | HTMLTextAreaElement>(page, selector).value;
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  expect(element).not.toBeNull();

  return element as T;
}
