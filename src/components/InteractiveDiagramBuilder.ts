// Shared helpers for the interactive figure builders (Three.js, Plotly, ...).

export type ControlDef =
  | { type: 'button'; id?: string; label: string; action?: () => void }
  | {
      type: 'checkbox';
      id?: string;
      label: string;
      checked?: boolean;
      action?: (checked: boolean) => void;
    }
  | {
      type: 'number' | 'range';
      id?: string;
      label: string;
      min?: number;
      max?: number;
      value?: number;
      step?: number;
      action?: (value: number) => void;
    }
  | {
      type: 'select';
      id?: string;
      label: string;
      options: string[];
      value?: string;
      action?: (value: string) => void;
    };

export interface ThemeColors {
  dark: boolean;
  background: string; // --bg
  surface: string; // --surface
  text: string; // --text
  heading: string; // --heading
  muted: string; // --muted
  border: string; // --border
  accent: string; // --accent
  accentStrong: string; // --accent-strong
  accentSoft: string; // --accent-soft
  error: string; // --error
  errorBg: string; // --error-bg
  errorBorder: string; // --error-border
}

// Reads the site's theme colors straight from the CSS custom properties
// (global.css), so figures stay in sync with the active theme without
// duplicating any hex values.
export function computeThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    dark: document.documentElement.dataset.theme === 'dark',
    background: read('--bg', '#f5f7f7'),
    surface: read('--surface', '#ffffff'),
    text: read('--text', '#1a2322'),
    heading: read('--heading', '#0d1413'),
    muted: read('--muted', '#64736f'),
    border: read('--border', '#d8e0de'),
    accent: read('--accent', '#0f766e'),
    accentStrong: read('--accent-strong', '#0b5e57'),
    accentSoft: read('--accent-soft', '#d7eeea'),
    error: read('--error', '#b91c1c'),
    errorBg: read('--error-bg', '#ffe6e6'),
    errorBorder: read('--error-border', '#ff9999'),
  };
}

export interface ControlRegistry {
  // Appends a control widget to the toolbar. The widget stores its current
  // value internally, readable through get().
  add: (def: ControlDef) => void;
  // Returns the current value of a widget (checkbox -> boolean,
  // number/range -> number, select -> string).
  get: <T>(id: string) => T | undefined;
  // Registers a callback invoked whenever a widget's value changes.
  onChange: (id: string, callback: (value: unknown) => void) => void;
}

// Creates the per-figure control-widget registry. Widgets are rendered as
// `label + input` flex groups inside `container` (the `.figure-controls` bar).
export function createControlRegistry(container: HTMLElement, prefix: string): ControlRegistry {
  const state = new Map<string, unknown>();
  const changeListeners = new Map<string, Array<(value: unknown) => void>>();

  function notifyChange(id: string, value: unknown): void {
    for (const callback of changeListeners.get(id) ?? []) callback(value);
  }

  function createElement(id: string, def: ControlDef): HTMLElement {
    const wrap = document.createElement('div');

    switch (def.type) {
      case 'button': {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = id;
        button.textContent = def.label;
        button.addEventListener('click', () => def.action?.());
        wrap.appendChild(button);
        break;
      }
      case 'checkbox': {
        const label = document.createElement('label');
        label.textContent = def.label;
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = def.checked ?? false;
        state.set(id, input.checked);
        input.addEventListener('change', () => {
          state.set(id, input.checked);
          def.action?.(input.checked);
          notifyChange(id, input.checked);
        });
        wrap.append(label, input);
        break;
      }
      case 'number':
      case 'range': {
        const label = document.createElement('label');
        label.textContent = def.label;
        label.htmlFor = id;
        const input = document.createElement('input');
        input.type = def.type;
        input.id = id;
        if (def.min !== undefined) input.min = String(def.min);
        if (def.max !== undefined) input.max = String(def.max);
        if (def.step !== undefined) input.step = String(def.step);
        if (def.value !== undefined) input.value = String(def.value);
        state.set(id, def.value ?? (parseFloat(input.value) || 0));
        input.addEventListener('input', () => {
          const value = parseFloat(input.value);
          state.set(id, value);
          def.action?.(value);
          notifyChange(id, value);
        });
        wrap.append(label, input);
        break;
      }
      case 'select': {
        const label = document.createElement('label');
        label.textContent = def.label;
        label.htmlFor = id;
        const select = document.createElement('select');
        select.id = id;
        for (const option of def.options ?? []) {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          select.appendChild(opt);
        }
        if (def.value !== undefined) select.value = String(def.value);
        state.set(id, select.value);
        select.addEventListener('change', () => {
          state.set(id, select.value);
          def.action?.(select.value);
          notifyChange(id, select.value);
        });
        wrap.append(label, select);
        break;
      }
      default:
        console.warn('InteractiveDiagramBuilder: unknown control type');
    }

    return wrap;
  }

  let index = 0;
  return {
    add(def: ControlDef): void {
      const id = def.id ?? `${prefix}-control-${index}`;
      container.appendChild(createElement(id, def));
      index++;
    },
    get: <T>(id: string): T | undefined => state.get(id) as T | undefined,
    onChange(id: string, callback: (value: unknown) => void): void {
      const list = changeListeners.get(id) ?? [];
      list.push(callback);
      changeListeners.set(id, list);
    },
  };
}

// Shows a fallback message inside the figure when something goes wrong.
export function showFigureError(container: HTMLElement, message: string, extraClass = ''): void {
  const error = document.createElement('div');
  error.className = ['figure-error', extraClass].filter(Boolean).join(' ');
  error.textContent = message;
  container.replaceChildren(error);
}

// Loads a per-figure construction script and returns its default export.
export async function loadFigureScript<T>(src: string): Promise<T | null> {
  try {
    const module = (await import(/* @vite-ignore */ src)) as { default?: T };
    if (typeof module.default !== 'function') {
      throw new Error(`Module ${src} does not export a default builder function`);
    }
    return module.default;
  } catch (error) {
    console.error(`InteractiveDiagramBuilder: failed to load figure script ${src}`, error);
    return null;
  }
}