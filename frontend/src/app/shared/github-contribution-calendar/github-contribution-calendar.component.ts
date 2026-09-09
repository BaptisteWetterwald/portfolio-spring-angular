import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';

import {
  GitHubContributionCalendarDto,
  GitHubContributionDayDto,
} from '../../core/github/github-activity.models';
import { SupportedLocale } from '../../core/i18n/locales';
import { TranslationService } from '../../core/i18n/translation.service';

interface ContributionDayView extends GitHubContributionDayDto {
  readonly intensity: number;
}

interface ContributionWeekView {
  readonly startsOn: string;
  readonly days: readonly (ContributionDayView | null)[];
}

interface ContributionMonthView {
  readonly key: string;
  readonly label: string;
  readonly column: number;
  readonly span: number;
}

interface ContributionCalendarView {
  readonly weeks: readonly ContributionWeekView[];
  readonly months: readonly ContributionMonthView[];
  readonly weekdayLabels: readonly string[];
}

@Component({
  selector: 'app-github-contribution-calendar',
  templateUrl: './github-contribution-calendar.component.html',
  styleUrls: [
    './github-contribution-calendar.component.css',
    './github-contribution-calendar.tooltip.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GitHubContributionCalendarComponent {
  @ViewChild('scrollRegion') private scrollRegion?: ElementRef<HTMLElement>;

  readonly #injector = inject(Injector);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #translations = inject(TranslationService);

  readonly calendar = input.required<GitHubContributionCalendarDto>();
  readonly locale = input.required<SupportedLocale>();

  protected readonly view = computed(() => buildCalendarView(this.calendar(), this.locale()));

  constructor() {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    afterNextRender(() => this.#showMostRecentWeeks(), { injector: this.#injector });
  }

  protected totalLabel(): string {
    return this.interpolate('github.contributions.total', {
      count: new Intl.NumberFormat(this.locale()).format(this.calendar().totalContributions),
    });
  }

  protected rangeLabel(): string {
    return this.interpolate('github.contributions.range', {
      start: this.formatDate(this.calendar().startsOn),
      end: this.formatDate(this.calendar().endsOn),
    });
  }

  protected scrollLabel(): string {
    return this.#translations.translateFor(this.locale(), 'github.contributions.scrollLabel');
  }

  protected scrollHint(): string {
    return this.#translations.translateFor(this.locale(), 'github.contributions.scrollHint');
  }

  protected lessLabel(): string {
    return this.#translations.translateFor(this.locale(), 'github.contributions.less');
  }

  protected moreLabel(): string {
    return this.#translations.translateFor(this.locale(), 'github.contributions.more');
  }

  protected dayLabel(day: ContributionDayView): string {
    const key =
      day.contributionCount === 0
        ? 'github.contributions.dayZero'
        : day.contributionCount === 1
          ? 'github.contributions.dayOne'
          : 'github.contributions.dayMany';

    return this.interpolate(key, {
      count: new Intl.NumberFormat(this.locale()).format(day.contributionCount),
      date: this.formatDate(day.date),
    });
  }

  protected dayTooltipLabel(day: ContributionDayView): string {
    const key =
      day.contributionCount === 0
        ? 'github.contributions.tooltipZero'
        : day.contributionCount === 1
          ? 'github.contributions.tooltipOne'
          : 'github.contributions.tooltipMany';

    const count = this.interpolate(key, {
      count: new Intl.NumberFormat(this.locale()).format(day.contributionCount),
    });

    return `${this.formatDate(day.date)}\n${count}`;
  }

  protected dayClass(day: ContributionDayView, weekday: number): string {
    const placement = weekday < 3 ? 'tooltip-bottom' : 'tooltip-top';

    return `tooltip tooltip-center ${placement} github-contribution-calendar__day github-contribution-calendar__day--level-${day.intensity}`;
  }

  protected positionTooltip(event: PointerEvent): void {
    if (!isPlatformBrowser(this.#platformId) || !(event.target instanceof HTMLElement)) {
      return;
    }

    const day = event.target.closest<HTMLElement>('[data-contribution-count]');
    const region = this.scrollRegion?.nativeElement;
    if (!day || !region?.contains(day)) {
      return;
    }

    const dayBounds = day.getBoundingClientRect();
    const regionBounds = region.getBoundingClientRect();
    const edgeRange = Math.min(120, regionBounds.width / 3);
    const distanceFromStart = dayBounds.left - regionBounds.left;
    const distanceFromEnd = regionBounds.right - dayBounds.right;
    const alignment =
      distanceFromStart < edgeRange
        ? 'tooltip-start'
        : distanceFromEnd < edgeRange
          ? 'tooltip-end'
          : 'tooltip-center';

    day.classList.remove('tooltip-start', 'tooltip-center', 'tooltip-end');
    day.classList.add(alignment);
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(parseIsoDate(value));
  }

  private interpolate(key: string, values: Readonly<Record<string, string>>): string {
    return Object.entries(values).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, value),
      this.#translations.translateFor(this.locale(), key),
    );
  }

  #showMostRecentWeeks(): void {
    const region = this.scrollRegion?.nativeElement;

    if (region) {
      region.scrollLeft = region.scrollWidth - region.clientWidth;
    }
  }
}

function buildCalendarView(
  calendar: GitHubContributionCalendarDto,
  locale: SupportedLocale,
): ContributionCalendarView {
  const daysByDate = new Map(calendar.days.map((day) => [day.date, day]));
  const intensityByCount = contributionIntensities(calendar.days);
  const startsOn = parseIsoDate(calendar.startsOn);
  const endsOn = parseIsoDate(calendar.endsOn);
  const firstWeek = addDays(startsOn, -startsOn.getUTCDay());
  const lastWeek = addDays(endsOn, -endsOn.getUTCDay());
  const weeks: ContributionWeekView[] = [];

  for (let weekStart = firstWeek; weekStart <= lastWeek; weekStart = addDays(weekStart, 7)) {
    const days = Array.from({ length: 7 }, (_, weekday) => {
      const date = addDays(weekStart, weekday);
      const dateKey = isoDate(date);
      const day = daysByDate.get(dateKey);

      return day
        ? {
            ...day,
            intensity:
              day.contributionCount === 0 ? 0 : (intensityByCount.get(day.contributionCount) ?? 1),
          }
        : null;
    });

    weeks.push({ startsOn: isoDate(weekStart), days });
  }

  return {
    weeks,
    months: contributionMonths(weeks, locale),
    weekdayLabels: contributionWeekdays(locale),
  };
}

function contributionIntensities(
  days: readonly GitHubContributionDayDto[],
): ReadonlyMap<number, number> {
  const counts = [
    ...new Set(days.map((day) => day.contributionCount).filter((count) => count > 0)),
  ].sort((first, second) => first - second);

  return new Map(
    counts.map((count, index) => [
      count,
      counts.length === 1 ? 1 : 1 + Math.round((index * 3) / (counts.length - 1)),
    ]),
  );
}

function contributionMonths(
  weeks: readonly ContributionWeekView[],
  locale: SupportedLocale,
): readonly ContributionMonthView[] {
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const months: Omit<ContributionMonthView, 'span'>[] = [];
  const seenMonths = new Set<string>();

  weeks.forEach((week, weekIndex) => {
    const visibleDays = week.days.filter((day): day is ContributionDayView => day !== null);
    const candidates =
      weekIndex === 0
        ? visibleDays.slice(0, 1)
        : visibleDays.filter((day) => day.date.endsWith('-01'));

    candidates.forEach((day) => {
      const key = day.date.slice(0, 7);
      if (!seenMonths.has(key)) {
        seenMonths.add(key);
        months.push({
          key,
          label: monthFormatter.format(parseIsoDate(day.date)),
          column: weekIndex + 1,
        });
      }
    });
  });

  return months.map((month, index) => ({
    ...month,
    span: (months[index + 1]?.column ?? weeks.length + 1) - month.column,
  }));
}

function contributionWeekdays(locale: SupportedLocale): readonly string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const sunday = new Date('2024-01-07T00:00:00Z');

  return Array.from({ length: 7 }, (_, weekday) =>
    weekday === 1 || weekday === 3 || weekday === 5
      ? formatter.format(addDays(sunday, weekday))
      : '',
  );
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);

  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
