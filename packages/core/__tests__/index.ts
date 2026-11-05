import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';
import * as easepick from '../src/index';
const pkg = require('../package.json');

// 23 Nov, 2019 - repository creation date
const date = new DateTime(new Date(2019, 10, 23, 0, 0, 0, 0));

window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});
window['__VERSION__'] = pkg.version;

document.body.innerHTML = '<input id="datepicker"/>';

test('date', () => {
  const d = date.clone();
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    date: d,
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});

test('firstDay', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    firstDay: 0,
  });

  expect(picker.ui.container.querySelector('.dayname').textContent === 'Sun').toBe(true);
});

test('format', () => {
  const d = date.clone();
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    date: d.format('D MMM YYYY'),
    format: 'D MMM YYYY',
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});

test('grid', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    grid: 2,
  });

  expect(picker.ui.container.querySelector('.calendars').classList.contains('grid-2')).toBe(true);
});

test('calendars', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    calendars: 2,
  });

  expect(picker.ui.container.querySelectorAll('.calendar').length === 2).toBe(true);
});

test('lang', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    lang: 'ru-RU',
  });

  expect(picker.ui.container.querySelector('.dayname').textContent === 'пн').toBe(true);
});

describe('month title', () => {
  const monthName = (lang: string) => {
    const picker = new easepick.create({
      element: document.getElementById('datepicker'),
      date: date.clone(),
      lang,
    });

    return picker.ui.container.querySelector('.month-name');
  };

  test('uses the nominative form, not the genitive (Greek)', () => {
    expect(monthName('el-GR').querySelector('span').textContent).toBe('Νοέμβριος');
  });

  test('Russian', () => {
    expect(monthName('ru-RU').querySelector('span').textContent.toLowerCase()).toBe('ноябрь');
  });

  test('English', () => {
    expect(monthName('en-US').textContent).toBe('November 2019');
  });

  test('numeric-month languages keep the month suffix (Japanese)', () => {
    expect(monthName('ja-JP').querySelector('span').textContent).toBe('11月');
  });

  test('AmpPlugin month dropdown uses the nominative form (Greek)', () => {
    // Passed as a variable: plugins add their options to the built
    // core types (dist/types), and this file tests core from src.
    const options = {
      element: document.getElementById('datepicker'),
      date: date.clone(),
      lang: 'el-GR',
      plugins: [AmpPlugin],
      AmpPlugin: {
        dropdown: { months: true, years: true },
      },
    };
    const picker = new easepick.create(options);
    const select = picker.ui.container.querySelector('.month-name--dropdown') as HTMLSelectElement;
    const months = Array.from(select.options).map(o => o.text);

    expect(months.length).toBe(12);
    expect(months[10]).toBe('Νοέμβριος');
    expect(months[0]).toBe('Ιανουάριος');
    expect(select.value).toBe('10');
  });

  test('keeps the [span, year] structure AmpPlugin relies on', () => {
    const nodes = monthName('el-GR').childNodes;

    expect(nodes.length).toBe(2);
    expect(nodes[0].nodeName).toBe('SPAN');
    expect(nodes[1].textContent).toBe(' 2019');
  });
});

test('readonly', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    readonly: false,
  });

  expect((picker.options.element as HTMLInputElement).readOnly).toBe(false);
});

test('autoApply', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    autoApply: false,
  });

  expect(picker.ui.container.querySelector('footer') instanceof HTMLElement).toBe(true);
});

test('locale', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    autoApply: false,
    locale: {
      apply: 'OK',
    }
  });

  expect(picker.ui.container.querySelector('.apply-button').textContent === 'OK').toBe(true);
});

test('plugins', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    plugins: [RangePlugin],
  });

  expect(picker.ui.container.querySelector('.range-plugin-tooltip') instanceof HTMLElement).toBe(true);
});

test('documentClick default', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
  });
  (picker.options.element as HTMLElement).dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);

  document.dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(false);
});


test('documentClick false', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    documentClick: false,
  });

  (picker.options.element as HTMLElement).dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);

  document.dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);
});

test('setup', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    setup(picker) {
      picker.setDate(date);
    }
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});
