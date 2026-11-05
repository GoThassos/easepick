import { BasePlugin, IEventDetail, IPlugin } from '@gothassos/easepick-base-plugin';
import { DateTime } from '@gothassos/easepick-datetime';
import { ISamplePlugin } from './interface';
import './index.scss';

export class SamplePlugin extends BasePlugin implements IPlugin {

  public binds = {
    onView: this.onView.bind(this),
  }

  public options: ISamplePlugin = {
    fgColor: '#fff',
    bgColor: '#000',
  };

  /**
   * Returns plugin name
   *
   * @returns String
   */
  public getName(): string {
    return 'SamplePlugin';
  }

  /**
   * - Called automatically via BasePlugin.attach() -
   * The function execute on initialize the picker
   */
  public onAttach(): void {
    this.picker.on('view', this.binds.onView);
  }

  /**
   * - Called automatically via BasePlugin.detach() -
   */
  public onDetach(): void {
    this.picker.off('view', this.binds.onView);
  }

  /**
   * Function `view` event
   * Changes `backgroundColor` and `color` of today
   *
   * @param event
   */
  private onView(event: CustomEvent) {
    const { view, date, target }: IEventDetail = event.detail;

    if (view === 'CalendarDay' && date.isSame(new DateTime(), 'day')) {
      target.style.backgroundColor = this.options.bgColor;
      target.style.color = this.options.fgColor;
    }
  }
}

export { ISamplePlugin };
