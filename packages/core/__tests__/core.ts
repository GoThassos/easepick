import { DateTime } from '@gothassos/easepick-datetime';
import { Core } from '../src/index';
import { IPickerConfig } from '../src/types';
const pkg = require('../package.json');

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

const time = (y: number, m: number, d: number) => String(new Date(y, m - 1, d).getTime());

const create = (options: Partial<IPickerConfig> = {}, element: HTMLElement = null) => {
  const el = element || document.createElement('input');
  if (!el.isConnected) document.body.append(el);

  return new Core({ element: el, ...options });
};

const click = (element: Element, init: MouseEventInit = {}) =>
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));

const day = (picker: Core, y: number, m: number, d: number) =>
  picker.ui.container.querySelector<HTMLElement>(`.day[data-time="${time(y, m, d)}"]`);

const monthName = (picker: Core) =>
  picker.ui.container.querySelector('.month-name').textContent;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('construction', () => {
  test('wrapper, shadow root and container', () => {
    const picker = create();
    const { wrapper, shadowRoot, container } = picker.ui;

    expect(wrapper.className).toBe('easepick-wrapper');
    expect(wrapper.previousElementSibling).toBe(picker.options.element);
    expect(shadowRoot).toBe(wrapper.shadowRoot);
    expect(container.parentNode).toBe(shadowRoot);
    expect(container.className).toBe('container');
    expect(picker.version).toBe(pkg.version);
  });

  test('element given as a selector', () => {
    const input = document.createElement('input');
    input.id = 'by-selector';
    document.body.append(input);
    const picker = new Core({ element: '#by-selector' });

    expect(picker.options.element).toBe(input);
    expect(input.nextElementSibling).toBe(picker.ui.wrapper);
  });

  test('locale is merged with the defaults', () => {
    const picker = create({ locale: { cancel: 'Nope' } });

    expect(picker.options.locale.cancel).toBe('Nope');
    expect(picker.options.locale.apply).toBe('Apply');
    expect(picker.options.locale.nextMonth).toContain('<svg');
  });

  test('zIndex', () => {
    expect(create({ zIndex: 42 }).ui.container.style.zIndex).toBe('42');
    expect(create().ui.container.style.zIndex).toBe('');
  });

  test('readonly defaults to true', () => {
    const picker = create();

    expect((picker.options.element as HTMLInputElement).readOnly).toBe(true);
  });

  test('reads the initial date from the input value', () => {
    const input = document.createElement('input');
    input.value = '2019-11-23';
    const picker = create({}, input);

    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
    expect(monthName(picker)).toBe('November 2019');
    expect(day(picker, 2019, 11, 23).classList.contains('selected')).toBe(true);
  });

  test('without a date, the value is null and today is shown', () => {
    jest.useFakeTimers().setSystemTime(new Date(2019, 10, 23, 10, 0));
    try {
      const picker = create();

      expect(picker.getDate()).toBeNull();
      expect(monthName(picker)).toBe('November 2019');
      expect(day(picker, 2019, 11, 23).classList.contains('today')).toBe(true);
      expect(picker.ui.container.querySelectorAll('.day.selected').length).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  test('weekends are marked', () => {
    const picker = create({ date: '2019-11-23' });

    expect(day(picker, 2019, 11, 23).classList.contains('weekend')).toBe(true);
    expect(day(picker, 2019, 11, 24).classList.contains('weekend')).toBe(true);
    expect(day(picker, 2019, 11, 25).classList.contains('weekend')).toBe(false);
  });

  test('a non-input element shows the date as text', () => {
    const div = document.createElement('div');
    const picker = create({ date: '2019-11-23' }, div);

    expect(div.innerText).toBe('2019-11-23');

    picker.clear();
    expect(div.innerText).toBe('');
  });

  test('setup receives the picker before the first render', () => {
    const setup = jest.fn();
    const picker = create({ setup });

    expect(setup).toHaveBeenCalledWith(picker);
  });
});

describe('css option', () => {
  test('string: injected as a style element, wrapper shown', () => {
    const picker = create({ css: '.container { color: red; }' });
    const style = picker.ui.shadowRoot.querySelector('style');

    expect(style.textContent).toBe('.container { color: red; }');
    expect(picker.ui.wrapper.style.display).toBe('');
  });

  test('array: one link per stylesheet, wrapper shown once all have loaded or failed', () => {
    const picker = create({ css: ['a.css', 'b.css'] });
    const links = [...picker.ui.shadowRoot.querySelectorAll('link')];

    expect(links.map(l => [l.getAttribute('href'), l.rel])).toEqual([
      ['a.css', 'stylesheet'],
      ['b.css', 'stylesheet'],
    ]);
    expect(picker.ui.wrapper.style.display).toBe('none');

    links[0].dispatchEvent(new Event('load'));
    expect(picker.cssLoaded).toBe(1);
    expect(picker.ui.wrapper.style.display).toBe('none');

    links[1].dispatchEvent(new Event('error'));
    expect(picker.cssLoaded).toBe(2);
    expect(picker.ui.wrapper.style.display).toBe('');
  });

  test('function: called with the picker, wrapper shown', () => {
    const css = jest.fn();
    const picker = create({ css });

    expect(css).toHaveBeenCalledWith(picker);
    expect(css.mock.contexts[0]).toBe(picker);
    expect(picker.ui.wrapper.style.display).toBe('');
  });

  test('default (empty array): wrapper stays hidden', () => {
    const picker = create();

    expect(picker.ui.shadowRoot.querySelectorAll('link, style').length).toBe(0);
    expect(picker.ui.wrapper.style.display).toBe('none');
  });
});

describe('header option', () => {
  test('false (default): no header', () => {
    expect(create().ui.container.querySelector('header')).toBeNull();
  });

  test('true: an empty header', () => {
    const header = create({ header: true }).ui.container.querySelector('header');

    expect(header).not.toBeNull();
    expect(header.innerHTML).toBe('');
  });

  test('string: used as HTML', () => {
    const header = create({ header: '<b>Pick a day</b>' }).ui.container.querySelector('header');

    expect(header.innerHTML).toBe('<b>Pick a day</b>');
  });

  test('HTMLElement: appended', () => {
    const element = document.createElement('h2');
    element.textContent = 'Title';
    const picker = create({ header: element });

    expect(picker.ui.container.querySelector('header > h2')).toBe(element);
  });

  test('header is the first child of the container', () => {
    const picker = create({ header: 'x', autoApply: false });

    expect([...picker.ui.container.children].map(x => x.tagName)).toEqual(['HEADER', 'MAIN', 'FOOTER']);
  });
});

describe('show / hide', () => {
  test('clicking the element shows; hide() hides', () => {
    const picker = create();
    const onShow = jest.fn();
    const onHide = jest.fn();
    picker.on('show', onShow);
    picker.on('hide', onHide);

    expect(picker.isShown()).toBe(false);
    click(picker.options.element as HTMLElement);
    expect(picker.isShown()).toBe(true);
    expect(onShow.mock.calls[0][0].detail.target).toBe(picker.options.element);

    picker.hide();
    expect(picker.isShown()).toBe(false);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  test('show() without an event uses the element; showing twice is a no-op', () => {
    const picker = create();
    const onShow = jest.fn();
    picker.on('show', onShow);

    picker.show();
    picker.show();

    expect(picker.isShown()).toBe(true);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onShow.mock.calls[0][0].detail.target).toBe(picker.options.element);
  });

  test('show() positions relative to the event target', () => {
    const picker = create();
    const other = document.createElement('button');
    document.body.append(other);
    const onShow = jest.fn();
    picker.on('show', onShow);

    picker.show({ target: other });

    expect(onShow.mock.calls[0][0].detail.target).toBe(other);
    expect(picker.ui.container.style.top).toMatch(/px$/);
    expect(picker.ui.container.style.left).toMatch(/px$/);
  });

  test('inline: always shown, never hidden by outside clicks', () => {
    const picker = create({ inline: true });

    expect(picker.ui.wrapper.style.position).toBe('relative');
    expect(picker.ui.container.classList.contains('inline')).toBe(true);
    expect(picker.isShown()).toBe(true);

    click(document.body);
    expect(picker.isShown()).toBe(true);
  });

  test('clicking the element itself does not hide it', () => {
    const picker = create();
    picker.show();
    click(picker.options.element as HTMLElement);

    expect(picker.isShown()).toBe(true);
  });

  test('clicks inside the picker do not hide it', () => {
    const picker = create();
    picker.show();
    // composed: the event leaves the shadow root, retargeted to the wrapper.
    click(picker.ui.container.querySelector('main'), { composed: true });

    expect(picker.isShown()).toBe(true);

    click(document.body);
    expect(picker.isShown()).toBe(false);
  });

  test('documentClick as a custom function', () => {
    const documentClick = jest.fn();
    const picker = create({ documentClick });
    picker.show();
    click(document.body);

    expect(documentClick).toHaveBeenCalledTimes(1);
    expect(picker.isShown()).toBe(true);

    picker.destroy();
    click(document.body);
    expect(documentClick).toHaveBeenCalledTimes(1);
  });
});

describe('events', () => {
  test('on / trigger / off', () => {
    const picker = create();
    const listener = jest.fn();
    picker.on('custom', listener);

    expect(picker.trigger('custom', { answer: 42 })).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ answer: 42 });

    picker.off('custom', listener);
    picker.trigger('custom');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('trigger without detail sends an empty object', () => {
    const picker = create();
    const listener = jest.fn();
    picker.on('custom', listener);
    picker.trigger('custom');

    expect(listener.mock.calls[0][0].detail).toEqual({});
  });

  test('a render event without a date renders the current month', () => {
    jest.useFakeTimers().setSystemTime(new Date(2019, 10, 23, 10, 0));
    try {
      const picker = create({ date: '2018-02-10' });
      expect(monthName(picker)).toBe('February 2018');

      picker.trigger('render', { view: 'Container' });
      expect(monthName(picker)).toBe('November 2019');
    } finally {
      jest.useRealTimers();
    }
  });

  test('a render event for an unknown view does nothing', () => {
    const picker = create({ date: '2019-11-23' });
    const html = picker.ui.container.innerHTML;
    picker.trigger('render', { view: 'Nope', date: new DateTime('2018-01-01') });

    expect(picker.ui.container.innerHTML).toBe(html);
  });
});

describe('dates', () => {
  test('setDate accepts strings, Date and timestamps', () => {
    const picker = create();

    picker.setDate('2019-11-23');
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-23');

    picker.setDate(new Date(2020, 0, 5));
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2020-01-05');

    picker.setDate(new Date(2021, 5, 7).getTime());
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2021-06-07');
  });

  test('setDate uses the format and lang options', () => {
    const picker = create({ format: 'DD MMMM YYYY', lang: 'fr-FR' });
    picker.setDate('05 mars 2020');

    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2020-03-05');
    expect((picker.options.element as HTMLInputElement).value).toBe('05 mars 2020');
  });

  test('getDate returns a copy', () => {
    const picker = create({ date: '2019-11-23' });
    picker.getDate().add(1, 'day');

    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
  });

  test('setDate re-renders the selection', () => {
    const picker = create({ date: '2019-11-23' });
    picker.setDate('2019-11-10');

    expect(day(picker, 2019, 11, 23).classList.contains('selected')).toBe(false);
    expect(day(picker, 2019, 11, 10).classList.contains('selected')).toBe(true);
  });

  test('clear', () => {
    const picker = create({ date: '2019-11-23' });
    const onClear = jest.fn();
    picker.on('clear', onClear);
    picker.clear();

    expect(picker.getDate()).toBeNull();
    expect((picker.options.element as HTMLInputElement).value).toBe('');
    expect(picker.ui.container.querySelectorAll('.day.selected').length).toBe(0);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('gotoDate changes the visible month, not the value', () => {
    const picker = create({ date: '2019-11-23' });
    picker.gotoDate('2020-03-15');

    expect(monthName(picker)).toBe('March 2020');
    expect(picker.calendars[0].format('YYYY-MM-DD')).toBe('2020-03-01');
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
  });

  test('grid and calendars render consecutive months', () => {
    const picker = create({ date: '2019-11-23', grid: 3, calendars: 3 });
    const names = [...picker.ui.container.querySelectorAll('.month-name')].map(x => x.textContent);

    expect(picker.ui.container.querySelector('.calendars').className).toBe('calendars grid-3');
    expect(names).toEqual(['November 2019', 'December 2019', 'January 2020']);
  });
});

describe('month navigation', () => {
  test('next and previous buttons', () => {
    const picker = create({ date: '2019-12-23' });
    const onRender = jest.fn();
    picker.on('render', onRender);

    click(picker.ui.container.querySelector('.next-button'));
    expect(monthName(picker)).toBe('January 2020');

    click(picker.ui.container.querySelector('.previous-button'));
    click(picker.ui.container.querySelector('.previous-button'));
    expect(monthName(picker)).toBe('November 2019');
    expect(onRender).toHaveBeenCalled();

    // Navigating does not change the value.
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-12-23');
  });

  test('clicks outside units are ignored', () => {
    const picker = create({ date: '2019-11-23' });
    const onSelect = jest.fn();
    picker.on('select', onSelect);

    click(picker.ui.container.querySelector('.month-name'));
    click(picker.ui.container.querySelector('.days-grid'));
    click(picker.ui.container.querySelector('.next-button svg'));

    expect(monthName(picker)).toBe('November 2019');
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('selecting a day', () => {
  test('autoApply (default): sets the value, fires select and hides', () => {
    const picker = create({ date: '2019-11-23' });
    const onSelect = jest.fn();
    picker.on('select', onSelect);
    picker.show();

    click(day(picker, 2019, 11, 5));

    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-05');
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05');
    expect(onSelect.mock.calls[0][0].detail.date.format('YYYY-MM-DD')).toBe('2019-11-05');
    expect(picker.isShown()).toBe(false);
  });

  describe('autoApply false', () => {
    const open = () => {
      const picker = create({ date: '2019-11-23', autoApply: false });
      const events = { preselect: jest.fn(), select: jest.fn(), hide: jest.fn() };
      Object.entries(events).forEach(([type, fn]) => picker.on(type, fn));
      picker.show();

      const apply = () => picker.ui.container.querySelector<HTMLButtonElement>('.apply-button');
      const cancel = () => picker.ui.container.querySelector<HTMLButtonElement>('.cancel-button');

      return { picker, events, apply, cancel };
    };

    test('a day is preselected and Apply is enabled', () => {
      const { picker, events, apply } = open();

      expect(apply().disabled).toBe(true);
      click(day(picker, 2019, 11, 5));

      expect(picker.isShown()).toBe(true);
      expect(picker.datePicked[0].format('YYYY-MM-DD')).toBe('2019-11-05');
      expect(day(picker, 2019, 11, 5).classList.contains('selected')).toBe(true);
      expect(day(picker, 2019, 11, 23).classList.contains('selected')).toBe(false);
      expect(apply().disabled).toBe(false);
      expect(events.preselect).toHaveBeenCalledTimes(1);
      expect(events.select).not.toHaveBeenCalled();
      // The value is unchanged until Apply.
      expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
    });

    test('Apply sets the value, fires select and hides', () => {
      const { picker, events, apply } = open();
      click(day(picker, 2019, 11, 5));
      click(apply());

      expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-05');
      expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05');
      expect(events.select.mock.calls[0][0].detail.date.format('YYYY-MM-DD')).toBe('2019-11-05');
      expect(picker.isShown()).toBe(false);
      expect(picker.datePicked.length).toBe(0);
    });

    test('Apply without a preselected day keeps the value', () => {
      const { picker, events, apply } = open();
      apply().disabled = false;
      click(apply());

      expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
      expect(events.select).toHaveBeenCalledTimes(1);
      expect(picker.isShown()).toBe(false);
    });

    test('Cancel discards the preselection and hides', () => {
      const { picker, events, cancel } = open();
      click(day(picker, 2019, 11, 5));
      click(cancel());

      expect(picker.isShown()).toBe(false);
      expect(picker.datePicked.length).toBe(0);
      expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
      expect(events.select).not.toHaveBeenCalled();
      expect(events.hide).toHaveBeenCalledTimes(1);
      expect(day(picker, 2019, 11, 23).classList.contains('selected')).toBe(true);
    });
  });
});

describe('destroy', () => {
  test('removes the wrapper and the listeners', () => {
    const picker = create();
    const element = picker.options.element as HTMLElement;
    const { wrapper } = picker.ui;
    picker.destroy();

    expect(wrapper.isConnected).toBe(false);

    click(element);
    expect(picker.isShown()).toBe(false);
  });

  test('the default documentClick listener is removed', () => {
    const picker = create();
    picker.show();
    picker.destroy();
    click(document.body);

    // Still "shown": the outside click no longer reaches hidePicker.
    expect(picker.isShown()).toBe(true);
  });

  test('documentClick false', () => {
    const picker = create({ documentClick: false });

    expect(() => picker.destroy()).not.toThrow();
    expect(picker.ui.wrapper.isConnected).toBe(false);
  });
});
