/**
 * @jest-environment node
 */
// A DOM without a `window` global (e.g. a DOM shim during server-side
// rendering): the picker still opens, positioned under the element, with no
// viewport flipping or clamping.
import { JSDOM } from 'jsdom';
const pkg = require('../package.json');

const { window: dom } = new JSDOM('<!doctype html><body></body>');
const globals = {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  HTMLInputElement: dom.HTMLInputElement,
  CustomEvent: dom.CustomEvent,
  __VERSION__: pkg.version,
};
Object.assign(globalThis, globals);

const { Core } = require('../src/index');

afterAll(() => dom.close());

const box = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

test('there is no window global', () => {
  expect(typeof window).toBe('undefined');
});

test('without a window, the picker opens below the element, unclamped', () => {
  const element = dom.document.createElement('input');
  dom.document.body.append(element);
  const picker = new Core({ element });

  // Would flip above and right-align in a 1024×768 viewport.
  const input = box(900, 700, 100, 30);
  element.getBoundingClientRect = () => input;
  picker.ui.wrapper.getBoundingClientRect = () => box(input.right, input.top, 0, 0);
  picker.ui.container.getBoundingClientRect = () => box(0, 0, 300, 350);
  picker.show();

  expect(picker.isShown()).toBe(true);
  expect(parseFloat(picker.ui.container.style.left) + input.right).toBe(900);
  expect(parseFloat(picker.ui.container.style.top) + input.top).toBe(730);
});
