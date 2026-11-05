import { IOption } from './interface';

export class Control {
  public range(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const el = document.createElement('input');
    el.type = 'range';
    el.value = String(opt.default);
    el.min = String(opt.min);
    el.max = String(opt.max);
    el.name = opt.name;
    control.appendChild(el);

    const span = document.createElement('span');
    span.innerText = String(opt.default);
    control.appendChild(span);

    return control;
  }

  public dropdown(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const el = document.createElement('select');
    el.name = opt.name;

    opt.values.forEach(v => {
      const optionItem = document.createElement('option');
      optionItem.selected = optionItem.value === opt.default;

      if (typeof v === 'object') {
        optionItem.text = v.text;
        optionItem.value = v.value;
      } else {
        optionItem.text = v;
        optionItem.value = v;
      }

      el.appendChild(optionItem);
    });

    control.appendChild(el);

    return control;
  }

  public boolean(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const toggle = document.createElement('input');
    toggle.id = `option-${opt.name}`;
    toggle.type = 'checkbox';
    toggle.checked = Boolean(opt.default);
    control.appendChild(toggle);

    const label = document.createElement('label');
    label.setAttribute('for', `option-${opt.name}`);
    control.appendChild(label);

    return control;
  }
  
  public number(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const left = document.createElement('button');
    left.innerText = '-';
    control.appendChild(left);

    const input = document.createElement('input');
    input.type = 'text';
    input.pattern = '[0-9]';
    input.value = String(opt.default);
    control.appendChild(input);

    const right = document.createElement('button');
    right.innerText = '+';
    control.appendChild(right);

    left.addEventListener('click', (e) => {
      e.preventDefault();

      if (e.target instanceof HTMLElement && e.target.nextElementSibling instanceof HTMLInputElement) {
        let value = Number(e.target.nextElementSibling.value);
        if (e.target.nextElementSibling.value === 'null') {
          value = 0;
        }
        const v = Number(value) - 1;
        input.value = isNaN(v) ? 'null' : String(v);
        control.dispatchEvent(new Event('input'));
      }
    });

    right.addEventListener('click', (e) => {
      e.preventDefault();

      if (e.target instanceof HTMLElement && e.target.previousElementSibling instanceof HTMLInputElement) {
        let value = Number(e.target.previousElementSibling.value);
        if (e.target.previousElementSibling.value === 'null') {
          value = 0;
        }
        const v = Number(value) + 1;
        input.value = isNaN(v) ? 'null' : String(v);
        control.dispatchEvent(new Event('input'));
      }
    });

    return control;
  }

  public string(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;
    control.innerHTML = String(opt.value);

    return control;
  } 

  public text(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const el = document.createElement('input');
    el.type = 'text';
    el.value = opt.default === null ? '' : String(opt.default);
    control.appendChild(el);

    return control;
  }

  public date(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-${opt.type}`;

    const el = document.createElement('input');
    el.type = 'date';
    el.value = opt.default ? String(opt.default) : null;
    control.appendChild(el);

    return control;
  }

  public unconfigurable(opt: IOption) {
    const control = document.createElement('div');
    control.className = `pkg-option-control pkg-option-unconfigurable`;
    control.innerHTML = 'Not available now';

    return control;
  }
}