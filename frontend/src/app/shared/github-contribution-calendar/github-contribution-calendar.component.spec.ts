import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GitHubContributionCalendarDto } from '../../core/github/github-activity.models';
import { SupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';
import { translations } from '../../core/i18n/translations';
import { GitHubContributionCalendarComponent } from './github-contribution-calendar.component';

describe('GitHubContributionCalendarComponent', () => {
  it('renders a 53-week contribution year with zero and four positive intensity levels', async () => {
    const calendar = contributionCalendar();
    const fixture = await createFixture('en', calendar);
    const element = fixture.nativeElement as HTMLElement;
    const days = Array.from(
      element.querySelectorAll<HTMLElement>('.github-contribution-calendar__day[role="img"]'),
    );

    expect(element.querySelectorAll('.github-contribution-calendar__week').length).toBe(53);
    expect(days.length).toBe(371);
    expect(new Set(days.map((day) => day.dataset['contributionLevel']))).toEqual(
      new Set(['0', '1', '2', '3', '4']),
    );
    expect(element.textContent).toContain(
      `${new Intl.NumberFormat('en').format(calendar.totalContributions)} contributions in the last year`,
    );
    expect(element.querySelectorAll('.github-contribution-calendar__months span').length).toBe(13);
  });

  it('exposes each date and count to assistive technology without adding 371 tab stops', async () => {
    const fixture = await createFixture('en', contributionCalendar());
    const element = fixture.nativeElement as HTMLElement;
    const scrollRegion = element.querySelector<HTMLElement>('[role="region"]');
    const days = Array.from(element.querySelectorAll<HTMLElement>('[data-contribution-count]'));
    const zeroDay = days.find((day) => day.dataset['contributionCount'] === '0');
    const activeDay = days.find((day) => day.dataset['contributionCount'] === '12');

    expect(scrollRegion?.getAttribute('tabindex')).toBe('0');
    expect(scrollRegion?.getAttribute('aria-label')).toContain('Scroll horizontally');
    expect(days.every((day) => !day.hasAttribute('tabindex'))).toBe(true);
    expect(zeroDay?.getAttribute('aria-label')).toContain('No contributions on');
    expect(activeDay?.getAttribute('aria-label')).toContain('12 contributions on');
    expect(days.every((day) => day.classList.contains('tooltip'))).toBe(true);
    expect(days.every((day) => !day.hasAttribute('title'))).toBe(true);
    expect(zeroDay?.dataset['tip']).toMatch(/^\w+ \d{1,2}, \d{4}\n0 contributions$/);
    expect(activeDay?.dataset['tip']).toMatch(/^\w+ \d{1,2}, \d{4}\n12 contributions$/);
    expect(element.querySelector('button, a')).toBeNull();
  });

  it('positions tooltips inward at the current horizontal scroll edges', async () => {
    const fixture = await createFixture('en', contributionCalendar());
    const element = fixture.nativeElement as HTMLElement;
    const scrollRegion = element.querySelector<HTMLElement>('[role="region"]')!;
    const days = Array.from(element.querySelectorAll<HTMLElement>('[data-contribution-count]'));
    const startDay = days[0]!;
    const centerDay = days[20]!;
    const endDay = days.at(-1)!;

    vi.spyOn(scrollRegion, 'getBoundingClientRect').mockReturnValue(bounds(0, 0, 360, 160));
    vi.spyOn(startDay, 'getBoundingClientRect').mockReturnValue(bounds(8, 40, 12, 12));
    vi.spyOn(centerDay, 'getBoundingClientRect').mockReturnValue(bounds(174, 40, 12, 12));
    vi.spyOn(endDay, 'getBoundingClientRect').mockReturnValue(bounds(340, 40, 12, 12));

    startDay.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    centerDay.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    endDay.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));

    expect(startDay.classList.contains('tooltip-start')).toBe(true);
    expect(centerDay.classList.contains('tooltip-center')).toBe(true);
    expect(endDay.classList.contains('tooltip-end')).toBe(true);
    expect(days[0]?.classList.contains('tooltip-bottom')).toBe(true);
    expect(days[6]?.classList.contains('tooltip-top')).toBe(true);
  });

  it('localizes summary, scrolling guidance, dates, and contribution labels in French', async () => {
    const fixture = await createFixture('fr', contributionCalendar());
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('contributions sur les 12 derniers mois');
    expect(element.textContent).toContain('Faites défiler horizontalement');
    expect(element.textContent).toContain('Moins');
    expect(element.textContent).toContain('Plus');
    expect(
      element
        .querySelector<HTMLElement>('[data-contribution-count="0"]')
        ?.getAttribute('aria-label'),
    ).toContain('Aucune contribution le');
    expect(
      element.querySelector<HTMLElement>('[data-contribution-count="12"]')?.dataset['tip'],
    ).toMatch(/^\d{1,2} \w+ \d{4}\n12 contributions$/);
  });

  it('uses portfolio theme tokens and horizontal containment hooks instead of GitHub palette classes', async () => {
    const fixture = await createFixture('en', contributionCalendar());
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.card.card-border')).not.toBeNull();
    expect(element.querySelector('.github-contribution-calendar__scroll')).not.toBeNull();
    expect(element.querySelector('.github-contribution-calendar__day--level-4')).not.toBeNull();
    expect(element.innerHTML).not.toContain('color: green');
    expect(element.innerHTML).not.toContain('github.com/users');
  });
});

async function createFixture(
  locale: SupportedLocale,
  calendar: GitHubContributionCalendarDto,
): Promise<ComponentFixture<GitHubContributionCalendarComponent>> {
  await TestBed.configureTestingModule({
    imports: [GitHubContributionCalendarComponent],
    providers: [
      {
        provide: TranslationService,
        useValue: {
          translateFor: (requestedLocale: SupportedLocale, key: keyof typeof translations.en) =>
            translations[requestedLocale][key],
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(GitHubContributionCalendarComponent);

  fixture.componentRef.setInput('locale', locale);
  fixture.componentRef.setInput('calendar', calendar);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function bounds(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({}),
  } as DOMRect;
}

function contributionCalendar(): GitHubContributionCalendarDto {
  const counts = [0, 1, 3, 7, 12] as const;
  const start = new Date('2025-09-07T00:00:00Z');
  const days = Array.from({ length: 371 }, (_, index) => {
    const date = new Date(start);

    date.setUTCDate(date.getUTCDate() + index);

    return {
      date: date.toISOString().slice(0, 10),
      contributionCount: counts[index % counts.length]!,
    };
  });

  return {
    totalContributions: days.reduce((total, day) => total + day.contributionCount, 0),
    startsOn: days[0]!.date,
    endsOn: days.at(-1)!.date,
    days,
  };
}
