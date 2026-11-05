import * as bundle from '@gothassos/easepick-bundle';
import { easepick, create } from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { PresetPlugin } from '@gothassos/easepick-preset-plugin';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { TimePlugin } from '@gothassos/easepick-time-plugin';
import { KbdPlugin } from '@gothassos/easepick-kbd-plugin';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';

describe('bundle', () => {
  test('re-exports the core and every plugin unchanged', () => {
    expect(bundle).toEqual({
      easepick,
      create,
      DateTime,
      LockPlugin,
      PresetPlugin,
      RangePlugin,
      TimePlugin,
      KbdPlugin,
      AmpPlugin,
    });
  });

  test.each([
    ['easepick', easepick],
    ['create', create],
    ['DateTime', DateTime],
    ['LockPlugin', LockPlugin],
    ['PresetPlugin', PresetPlugin],
    ['RangePlugin', RangePlugin],
    ['TimePlugin', TimePlugin],
    ['KbdPlugin', KbdPlugin],
    ['AmpPlugin', AmpPlugin],
  ])('%s is the same object as in its package', (name, value) => {
    expect(bundle[name]).toBe(value);
  });
});
