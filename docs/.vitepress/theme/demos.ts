// Options for the live demos on the example pages (ported from the original
// docs' components/examples/*.vue). Each matches the "Quick example" code on its page.
import type { Bundle } from './easepick';

type Options = Record<string, unknown>;

/** Booked/unavailable days in the current and next month, as on the original site. */
function sampleDates(): (string | [string, string])[] {
  const now = new Date();
  const cur = yearMonth(now);
  const next = yearMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  return [
    `${cur}-02`,
    [`${cur}-06`, `${cur}-11`],
    `${cur}-18`,
    `${cur}-19`,
    `${cur}-20`,
    `${cur}-25`,
    `${cur}-28`,
    `${next}-03`,
    `${next}-08`,
    `${next}-15`,
  ];
}

/** `YYYY-MM` in local time (same as the `[js.date.*]` placeholders in the code samples). */
function yearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const nightsTooltip = {
  tooltipNumber(num: number) {
    return num - 1;
  },
  locale: {
    one: 'night',
    other: 'nights',
  },
};

export const demos: Record<string, (ep: Bundle) => Options> = {
  home: () => ({
    inline: true,
    grid: 2,
    calendars: 2,
    plugins: ['RangePlugin', 'KbdPlugin', 'AmpPlugin'],
  }),

  basic: () => ({
    zIndex: 10,
  }),

  hotel: ({ DateTime }) => {
    const bookedDates = sampleDates().map((d) =>
      Array.isArray(d)
        ? [new DateTime(d[0], 'YYYY-MM-DD'), new DateTime(d[1], 'YYYY-MM-DD')]
        : new DateTime(d, 'YYYY-MM-DD'),
    );

    return {
      plugins: ['RangePlugin', 'LockPlugin'],
      css: ['/css/demo_hotelcal.css'],
      autoApply: false,
      zIndex: 10,
      RangePlugin: nightsTooltip,
      LockPlugin: {
        minDate: new Date(),
        minDays: 2,
        inseparable: true,
        filter(date, picked) {
          if (picked.length === 1) {
            const incl = date.isBefore(picked[0]) ? '[)' : '(]';
            return !picked[0].isSame(date, 'day') && date.inArray(bookedDates, incl);
          }

          return date.inArray(bookedDates, '[)');
        },
      },
    };
  },

  nights: () => ({
    zIndex: 10,
    plugins: ['RangePlugin'],
    RangePlugin: nightsTooltip,
  }),

  language: () => ({
    zIndex: 10,
    lang: 'sv-SE',
    plugins: ['RangePlugin'],
    RangePlugin: {
      locale: {
        one: 'dag',
        other: 'dagar',
      },
    },
  }),

  'allowed-days': () => {
    const ym = yearMonth(new Date());
    const allowed = ['01', '03', '07', '11', '17', '21'].map((day) => `${ym}-${day}`);

    return {
      zIndex: 10,
      plugins: ['LockPlugin'],
      LockPlugin: {
        filter(date) {
          return !allowed.includes(date.format('YYYY-MM-DD'));
        },
      },
    };
  },

  'days-with-prices': () => {
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    const prices: Record<string, number> = {};
    sampleDates().forEach((d) => {
      if (typeof d === 'string') prices[d] = randomInt(50, 200);
    });

    return {
      zIndex: 10,
      css: ['/css/demo_prices.css'],
      setup(picker) {
        picker.on('view', (evt: CustomEvent) => {
          const { view, date, target } = evt.detail;
          const d = date ? date.format('YYYY-MM-DD') : null;

          if (view === 'CalendarDay' && prices[d]) {
            const span = target.querySelector('.day-price') || document.createElement('span');
            span.className = 'day-price';
            span.innerHTML = `$ ${prices[d]}`;
            target.append(span);
          }
        });
      },
    };
  },

  customize: () => ({
    zIndex: 10,
    plugins: ['RangePlugin'],
    css: ['/css/customize_sample.css'],
  }),

  'month-picker': () => ({
    zIndex: 10,
    viewMode: 'month',
    format: 'MM/YYYY',
  }),

  'month-range': () => ({
    zIndex: 10,
    viewMode: 'month',
    format: 'MMM YYYY',
    plugins: ['RangePlugin'],
  }),

  'year-picker': () => ({
    zIndex: 10,
    viewMode: 'year',
    format: 'YYYY',
  }),

  'year-range': () => ({
    zIndex: 10,
    viewMode: 'year',
    format: 'YYYY',
    plugins: ['RangePlugin', 'LockPlugin'],
    LockPlugin: {
      maxDate: new Date(),
    },
  }),
};
