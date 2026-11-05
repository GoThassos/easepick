import { DateTime } from '../src/index';

// Parsing falls back to "today at midnight" for anything it cannot read.
const TODAY = new Date(2019, 10, 23, 15, 45, 30);
const todayMidnight = () => new Date(2019, 10, 23, 0, 0, 0, 0).getTime();

const parts = (d: Date) => [
  d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(),
];

describe('parsing', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(TODAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('default format YYYY-MM-DD', () => {
    expect(parts(new DateTime('2019-11-23'))).toEqual([2019, 11, 23, 0, 0, 0]);
  });

  test('stores the language', () => {
    const d = new DateTime('23 novembre 2019', 'D MMMM YYYY', 'fr-FR');

    expect(d.format('MMMM', 'fr-FR')).toBe('novembre');
  });

  test.each([
    ['D/M/YYYY', '3/7/2019', [2019, 7, 3, 0, 0, 0]],
    ['DD.MM.YYYY', '03.07.2019', [2019, 7, 3, 0, 0, 0]],
    ['YYYY-MM-DD HH:mm:ss', '2019-11-23 08:05:09', [2019, 11, 23, 8, 5, 9]],
    ['YYYY-MM-DD H:m:s', '2019-11-23 8:5:9', [2019, 11, 23, 8, 5, 9]],
    ['D MMM YYYY', '23 Nov 2019', [2019, 11, 23, 0, 0, 0]],
    ['MMMM D, YYYY', 'November 23, 2019', [2019, 11, 23, 0, 0, 0]],
  ])('format %s parses %s', (format, value, expected) => {
    expect(parts(new DateTime(value, format))).toEqual(expected);
  });

  test('MMM and MMMM use the language month names', () => {
    expect(parts(new DateTime('23 novembre 2019', 'D MMMM YYYY', 'fr-FR'))).toEqual([2019, 11, 23, 0, 0, 0]);
    expect(parts(new DateTime('5 Mär 2019', 'D MMM YYYY', 'de-DE'))).toEqual([2019, 3, 5, 0, 0, 0]);
  });

  test('missing day defaults to the 1st', () => {
    expect(parts(new DateTime('November 2019', 'MMMM YYYY'))).toEqual([2019, 11, 1, 0, 0, 0]);
  });

  test('text before the first token is skipped', () => {
    expect(parts(new DateTime('on 2019-11-23', 'on YYYY-MM-DD'))).toEqual([2019, 11, 23, 0, 0, 0]);
  });

  test('escaped tokens are treated as literals', () => {
    // `\D` is not a day token, so the day comes from the plain `D`.
    expect(parts(new DateTime('D 23/11/2019', '\\D D/MM/YYYY'))).toEqual([2019, 11, 23, 0, 0, 0]);
  });

  test('12-hour clock with AM/PM', () => {
    expect(parts(new DateTime('2019-11-23 03:30 PM', 'YYYY-MM-DD hh:mm A'))).toEqual([2019, 11, 23, 15, 30, 0]);
    expect(parts(new DateTime('2019-11-23 3:30 AM', 'YYYY-MM-DD h:mm A'))).toEqual([2019, 11, 23, 3, 30, 0]);
  });

  test('12 AM is midnight and 12 PM is noon', () => {
    expect(new DateTime('2019-11-23 12:00 AM', 'YYYY-MM-DD hh:mm A').getHours()).toBe(0);
    expect(new DateTime('2019-11-23 12:30 PM', 'YYYY-MM-DD hh:mm A').getHours()).toBe(12);
  });

  test('lowercase am/pm', () => {
    expect(new DateTime('2019-11-23 03:00 pm', 'YYYY-MM-DD hh:mm a').getHours()).toBe(15);
    expect(new DateTime('2019-11-23 12:00 am', 'YYYY-MM-DD hh:mm a').getHours()).toBe(0);
  });

  test('formatting with h:mm A parses back to the same time', () => {
    for (const hours of [0, 1, 11, 12, 13, 23]) {
      const d = new DateTime(new Date(2019, 10, 23, hours, 5));
      expect(new DateTime(d.format('YYYY-MM-DD h:mm A'), 'YYYY-MM-DD h:mm A').getHours()).toBe(hours);
    }
  });

  test('two-digit years: 00–68 are 20xx, 69–99 are 19xx', () => {
    expect(new DateTime('23/11/19', 'DD/MM/YY').getFullYear()).toBe(2019);
    expect(new DateTime('01/01/68', 'DD/MM/YY').getFullYear()).toBe(2068);
    expect(new DateTime('01/01/69', 'DD/MM/YY').getFullYear()).toBe(1969);
    expect(new DateTime('01/01/2019', 'DD/MM/YYYY').getFullYear()).toBe(2019);
  });

  test('numeric timestamps (10+ digits), as number or string', () => {
    const ts = new Date(2019, 10, 23, 10, 20).getTime();

    expect(new DateTime(ts).getTime()).toBe(ts);
    expect(new DateTime(String(ts)).getTime()).toBe(ts);
    expect(new DateTime(-ts).getTime()).toBe(-ts);
  });

  test('formats without delimiters (YYYYMMDD, YYYY)', () => {
    expect(parts(new DateTime('20240115', 'YYYYMMDD'))).toEqual([2024, 1, 15, 0, 0, 0]);
    expect(parts(new DateTime('2024', 'YYYY'))).toEqual([2024, 1, 1, 0, 0, 0]);
  });

  test('Date and DateTime instances keep their time', () => {
    const js = new Date(2019, 10, 23, 10, 20, 30);
    const dt = new DateTime(js);

    expect(dt.getTime()).toBe(js.getTime());
    expect(new DateTime(dt).getTime()).toBe(js.getTime());
    expect(dt.toJSDate()).not.toBeInstanceOf(DateTime);
    expect(dt.toJSDate().getTime()).toBe(js.getTime());
  });

  test('clone is an independent copy', () => {
    const d = new DateTime('2019-11-23');
    const c = d.clone();
    c.add(1, 'day');

    expect(c).toBeInstanceOf(DateTime);
    expect(d.format('YYYY-MM-DD')).toBe('2019-11-23');
    expect(c.format('YYYY-MM-DD')).toBe('2019-11-24');
  });

  test.each([
    ['no value', undefined, undefined],
    ['null', null, undefined],
    ['empty string', '', undefined],
    ['a string not matching the format', 'not a date', 'YYYY-MM-DD'],
    ['a string with the wrong delimiters order', '23-11-2019', 'YYYY-MM-DD'],
    ['a format without tokens', '2019-11-23', 'xyz'],
    ['a short number', 12345, undefined],
    ['an object', {}, undefined],
  ])('falls back to today at midnight for %s', (_label, value, format) => {
    expect(new DateTime(value, format).getTime()).toBe(todayMidnight());
  });
});

describe('format', () => {
  // Saturday, 23 Nov 2019, 08:05:09
  const morning = new DateTime(new Date(2019, 10, 23, 8, 5, 9));
  // 3 Feb 2019, 15:45:30
  const afternoon = new DateTime(new Date(2019, 1, 3, 15, 45, 30));

  test.each([
    ['YYYY', '2019', '2019'],
    ['YY', '19', '19'],
    ['M', '11', '2'],
    ['MM', '11', '02'],
    ['MMM', 'Nov', 'Feb'],
    ['MMMM', 'November', 'February'],
    ['D', '23', '3'],
    ['DD', '23', '03'],
    ['H', '8', '15'],
    ['HH', '08', '15'],
    ['h', '8', '3'],
    ['hh', '08', '03'],
    ['m', '5', '45'],
    ['mm', '05', '45'],
    ['s', '9', '30'],
    ['ss', '09', '30'],
    ['a', 'am', 'pm'],
    ['A', 'AM', 'PM'],
  ])('token %s', (token, expectedMorning, expectedAfternoon) => {
    expect(morning.format(token)).toBe(expectedMorning);
    expect(afternoon.format(token)).toBe(expectedAfternoon);
  });

  test('h and hh show 12 at midnight and noon', () => {
    const midnight = new DateTime(new Date(2019, 10, 23, 0, 0));
    const noon = new DateTime(new Date(2019, 10, 23, 12, 0));

    expect(midnight.format('h A')).toBe('12 AM');
    expect(midnight.format('hh a')).toBe('12 am');
    expect(noon.format('h A')).toBe('12 PM');
  });

  test('keeps text before, between and after tokens', () => {
    expect(morning.format('on D MMM YYYY, @ HH:mm!')).toBe('on 23 Nov 2019, @ 08:05!');
  });

  test('escaped tokens are output literally without the backslash', () => {
    expect(morning.format('[\\D] D')).toBe('[D] 23');
  });

  test('a format without tokens returns an empty string', () => {
    expect(morning.format('xyz')).toBe('');
  });

  test('an unsupported token (YYY) formats as empty', () => {
    expect(morning.format('YYY')).toBe('');
  });

  test('month names follow the language', () => {
    expect(morning.format('D MMMM YYYY', 'fr-FR')).toBe('23 novembre 2019');
    expect(morning.format('MMM', 'de-DE')).toBe('Nov');
  });

  test('format and parse round-trip', () => {
    const format = 'DD MMM YYYY HH:mm:ss';

    expect(new DateTime(morning.format(format), format).getTime()).toBe(morning.getTime());
  });
});
