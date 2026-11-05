import { DateTime } from '../src/index';

const dt = (y: number, m: number, d: number, h = 0, min = 0) => new DateTime(new Date(y, m - 1, d, h, min));
const ymd = (d: DateTime) => d.format('YYYY-MM-DD');

describe('isBetween', () => {
  const start = dt(2019, 11, 20);
  const end = dt(2019, 11, 24);
  const inside = dt(2019, 11, 22, 18, 30);
  const before = dt(2019, 11, 19);
  const after = dt(2019, 11, 25);
  // Same days as the bounds, at another time: comparison is by day.
  const startDay = dt(2019, 11, 20, 23, 59);
  const endDay = dt(2019, 11, 24, 12);

  test.each([
    ['()', [true, false, false, false, false]],
    ['[)', [true, true, false, false, false]],
    ['(]', [true, false, true, false, false]],
    ['[]', [true, true, true, false, false]],
  ])('inclusivity %s', (inclusivity, expected) => {
    expect([inside, startDay, endDay, before, after].map(d => d.isBetween(start, end, inclusivity)))
      .toEqual(expected);
  });

  test('defaults to exclusive', () => {
    expect(inside.isBetween(start, end)).toBe(true);
    expect(start.isBetween(start, end)).toBe(false);
  });

  test('an unknown inclusivity behaves as ()', () => {
    expect(inside.isBetween(start, end, 'xx')).toBe(true);
    expect(start.isBetween(start, end, 'xx')).toBe(false);
  });
});

describe('inArray', () => {
  const list = [dt(2019, 11, 1), [dt(2019, 11, 10), dt(2019, 11, 15)]];

  test('matches single days by day', () => {
    expect(dt(2019, 11, 1, 18).inArray(list)).toBe(true);
  });

  test('matches ranges, inclusive by default', () => {
    expect(dt(2019, 11, 10).inArray(list)).toBe(true);
    expect(dt(2019, 11, 15).inArray(list)).toBe(true);
    expect(dt(2019, 11, 12).inArray(list)).toBe(true);
  });

  test('honours the inclusivity argument for ranges', () => {
    expect(dt(2019, 11, 10).inArray(list, '()')).toBe(false);
    expect(dt(2019, 11, 15).inArray(list, '[)')).toBe(false);
  });

  test('no match', () => {
    expect(dt(2019, 11, 2).inArray(list)).toBe(false);
    expect(dt(2019, 11, 2).inArray([])).toBe(false);
  });
});

describe('comparisons', () => {
  const base = dt(2019, 11, 23, 12);
  const sameDayEarlier = dt(2019, 11, 23, 1);
  const nextDay = dt(2019, 11, 24);
  const sameMonthLater = dt(2019, 11, 30);
  const nextMonth = dt(2019, 12, 1);
  const nextYear = dt(2020, 1, 1);
  const prevYear = dt(2018, 12, 31);

  test('isBefore', () => {
    for (const unit of ['day', 'days']) {
      expect(base.isBefore(nextDay, unit)).toBe(true);
      expect(base.isBefore(sameDayEarlier, unit)).toBe(false);
      expect(nextDay.isBefore(base, unit)).toBe(false);
    }
    for (const unit of ['month', 'months']) {
      expect(base.isBefore(nextMonth, unit)).toBe(true);
      expect(base.isBefore(sameMonthLater, unit)).toBe(false);
    }
    for (const unit of ['year', 'years']) {
      expect(base.isBefore(nextYear, unit)).toBe(true);
      expect(base.isBefore(nextMonth, unit)).toBe(false);
    }
    expect(base.isBefore(nextDay)).toBe(true);
  });

  test('isAfter', () => {
    for (const unit of ['day', 'days']) {
      expect(nextDay.isAfter(base, unit)).toBe(true);
      expect(base.isAfter(sameDayEarlier, unit)).toBe(false);
      expect(base.isAfter(nextDay, unit)).toBe(false);
    }
    for (const unit of ['month', 'months']) {
      expect(nextMonth.isAfter(base, unit)).toBe(true);
      expect(sameMonthLater.isAfter(base, unit)).toBe(false);
    }
    for (const unit of ['year', 'years']) {
      expect(base.isAfter(prevYear, unit)).toBe(true);
      expect(base.isAfter(dt(2019, 1, 1), unit)).toBe(false);
    }
    expect(nextDay.isAfter(base)).toBe(true);
  });

  test('isSameOrBefore', () => {
    for (const unit of ['day', 'days']) {
      expect(base.isSameOrBefore(sameDayEarlier, unit)).toBe(true);
      expect(base.isSameOrBefore(nextDay, unit)).toBe(true);
      expect(nextDay.isSameOrBefore(base, unit)).toBe(false);
    }
    for (const unit of ['month', 'months']) {
      expect(sameMonthLater.isSameOrBefore(base, unit)).toBe(true);
      expect(base.isSameOrBefore(nextMonth, unit)).toBe(true);
      expect(nextMonth.isSameOrBefore(base, unit)).toBe(false);
    }
  });

  test('isSameOrAfter', () => {
    for (const unit of ['day', 'days']) {
      expect(sameDayEarlier.isSameOrAfter(base, unit)).toBe(true);
      expect(nextDay.isSameOrAfter(base, unit)).toBe(true);
      expect(base.isSameOrAfter(nextDay, unit)).toBe(false);
    }
    for (const unit of ['month', 'months']) {
      expect(base.isSameOrAfter(sameMonthLater, unit)).toBe(true);
      expect(nextMonth.isSameOrAfter(base, unit)).toBe(true);
      expect(base.isSameOrAfter(nextMonth, unit)).toBe(false);
    }
  });

  test('isSame', () => {
    for (const unit of ['day', 'days']) {
      expect(base.isSame(sameDayEarlier, unit)).toBe(true);
      expect(base.isSame(nextDay, unit)).toBe(false);
    }
    for (const unit of ['month', 'months']) {
      expect(base.isSame(sameMonthLater, unit)).toBe(true);
      expect(base.isSame(nextMonth, unit)).toBe(false);
      // Same month number, another year.
      expect(base.isSame(dt(2020, 11, 23), unit)).toBe(false);
    }
  });

  test.each([
    ['isBefore', ['week', 'hour']],
    ['isAfter', ['week', 'hour']],
    ['isSameOrBefore', ['week', 'year']],
    ['isSameOrAfter', ['week', 'year']],
    ['isSame', ['week', 'year']],
  ])('%s throws on an unsupported unit', (method, units) => {
    for (const unit of units) {
      expect(() => base[method](nextDay, unit)).toThrow(`${method}: Invalid unit!`);
    }
  });
});

describe('diff', () => {
  test('days, ignoring the time of day', () => {
    expect(dt(2019, 11, 23, 1).diff(dt(2019, 11, 20, 23))).toBe(3);
    expect(dt(2019, 11, 20).diff(dt(2019, 11, 23), 'day')).toBe(-3);
    expect(dt(2019, 11, 23).diff(dt(2019, 11, 23, 18), 'days')).toBe(0);
  });

  test('days across a DST change are whole days', () => {
    expect(dt(2019, 11, 1).diff(dt(2019, 10, 1))).toBe(31);
    expect(dt(2019, 4, 1).diff(dt(2019, 3, 1))).toBe(31);
  });

  test('days across years', () => {
    expect(dt(2020, 1, 1).diff(dt(2019, 1, 1))).toBe(365);
    expect(dt(2021, 1, 1).diff(dt(2020, 1, 1))).toBe(366);
  });

  test('months', () => {
    expect(dt(2019, 11, 23).diff(dt(2019, 8, 30), 'month')).toBe(3);
    expect(dt(2019, 3, 1).diff(dt(2019, 8, 31), 'months')).toBe(-5);
    expect(dt(2019, 11, 1).diff(dt(2019, 11, 30), 'months')).toBe(0);
  });

  test('months across years', () => {
    expect(dt(2019, 1, 1).diff(dt(2018, 12, 31), 'months')).toBe(1);
    expect(dt(2018, 12, 31).diff(dt(2020, 2, 1), 'months')).toBe(-14);
  });

  test('an unknown unit counts days', () => {
    expect(dt(2019, 11, 23).diff(dt(2019, 11, 20), 'week')).toBe(3);
  });
});

describe('add / subtract', () => {
  test('days, mutating and returning the same instance', () => {
    const d = dt(2019, 11, 23);
    const r = d.add(10, 'day');

    expect(r).toBe(d);
    expect(ymd(d)).toBe('2019-12-03');
    expect(ymd(d.subtract(3, 'days'))).toBe('2019-11-30');
  });

  test('days default unit, across year boundaries', () => {
    expect(ymd(dt(2019, 12, 31).add(1))).toBe('2020-01-01');
    expect(ymd(dt(2020, 1, 1).subtract(1))).toBe('2019-12-31');
    expect(ymd(dt(2020, 2, 28).add(1))).toBe('2020-02-29');
  });

  test('months reset to the 1st, so the 31st never overflows', () => {
    expect(ymd(dt(2019, 1, 31).add(1, 'month'))).toBe('2019-02-01');
    expect(ymd(dt(2019, 3, 31).subtract(1, 'month'))).toBe('2019-02-01');
    expect(ymd(dt(2019, 8, 31).add(1, 'months'))).toBe('2019-09-01');
  });

  test('months across December / January', () => {
    expect(ymd(dt(2019, 12, 15).add(1, 'month'))).toBe('2020-01-01');
    expect(ymd(dt(2020, 1, 15).subtract(1, 'months'))).toBe('2019-12-01');
    expect(ymd(dt(2019, 11, 23).add(14, 'month'))).toBe('2021-01-01');
    expect(ymd(dt(2019, 2, 23).subtract(14, 'month'))).toBe('2017-12-01');
  });

  test('an unsupported unit is a no-op', () => {
    expect(ymd(dt(2019, 11, 23).add(1, 'year'))).toBe('2019-11-23');
    expect(ymd(dt(2019, 11, 23).subtract(1, 'year'))).toBe('2019-11-23');
  });
});

describe('getWeek', () => {
  test.each([
    // [date, firstDay, week]
    [[2019, 11, 23], 1, 47],
    [[2019, 11, 25], 1, 48],
    // 1 Jan 2018 is a Monday: week 1 starts that day.
    [[2018, 1, 1], 1, 1],
    [[2018, 1, 7], 1, 1],
    [[2018, 1, 8], 1, 2],
    // 1 Jan 2021 (Friday) belongs to the last week of 2020.
    [[2021, 1, 1], 1, 53],
    [[2021, 1, 4], 1, 1],
    // 30 Dec 2019 to 5 Jan 2020 is week 1 of 2020 (2019 has 52 ISO weeks).
    [[2019, 12, 29], 1, 52],
    [[2019, 12, 30], 1, 1],
    [[2020, 1, 2], 1, 1],
    [[2024, 12, 30], 1, 1],
    // 2020 has 53 ISO weeks.
    [[2020, 12, 31], 1, 53],
    // Sunday first: 29 Dec 2019 – 4 Jan 2020 holds 4 days of 2020.
    [[2019, 12, 29], 0, 1],
    [[2019, 12, 28], 0, 52],
    // A week in summer time (DST) is still counted as a whole week.
    [[2018, 6, 4], 1, 23],
    // Sunday as the first day of the week.
    [[2019, 11, 23], 0, 47],
    [[2019, 11, 24], 0, 48],
  ])('%j with firstDay %i is week %i', ([y, m, d], firstDay, week) => {
    expect(dt(y, m, d).getWeek(firstDay)).toBe(week);
  });

  test('ignores the time of day', () => {
    expect(dt(2019, 11, 23, 23, 59).getWeek(1)).toBe(dt(2019, 11, 23).getWeek(1));
  });
});
