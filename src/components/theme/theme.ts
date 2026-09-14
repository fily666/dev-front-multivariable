/**
 * El tema vive en un atributo del <html> y su copia persistente en `localStorage`. No es
 * estado de React y no puede serlo: el script en línea de `layout.tsx` tiene que poder
 * fijarlo antes de que exista React, o la primera pintura sale en claro y parpadea a
 * oscuro. Lo que hay aquí es la tienda externa que React consulta, no la fuente de verdad.
 */

export type Theme = 'light' | 'dark';

/** Clave del navegador. Cambiarla equivale a olvidar la elección de todo el mundo. */
export const THEME_STORAGE_KEY = 'linktic-theme';

/**
 * Script que corre antes del primer pintado. Va como string y no como módulo porque debe
 * ejecutarse de forma síncrona en el <head>, antes de que el navegador pinte el <body>.
 *
 * Se mantiene deliberadamente diminuto —es código bloqueante— y todo va dentro de un
 * `try`: en navegación privada `localStorage` lanza al leerse, y un tema es motivo
 * insuficiente para romper la página.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`;

/** Lo que el script dejó puesto en el <html>. */
export function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * En el servidor no hay documento, así que no hay tema que leer. Se responde «claro» y
 * React vuelve a renderizar con el valor real en cuanto hidrata; lo único que depende de
 * esta respuesta es el `aria-pressed` del interruptor, porque los iconos los decide el CSS.
 */
export function readServerTheme(): Theme {
  return 'light';
}

/** ¿Eligió algo el visitante en este navegador, o seguimos al sistema? */
export function hasExplicitChoice(): boolean {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light';
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

/** Aplica y recuerda. El atributo repinta la interfaz entera por herencia de los tokens. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento el tema dura lo que la pestaña. Es degradación aceptable.
  }
  for (const listener of listeners) listener();
}

/**
 * Suscripción para `useSyncExternalStore`. Además del cambio propio, escucha dos fuentes
 * externas:
 *
 * - El sistema, pero solo mientras el visitante no haya elegido: si el portátil pasa a
 *   oscuro al anochecer, la aplicación lo sigue; en cuanto se pulsa el botón, deja de
 *   seguirlo.
 * - Otras pestañas de la misma aplicación, para que el cambio no quede a medias cuando
 *   alguien tiene el panel abierto dos veces.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');

  function onSystemChange(event: MediaQueryListEvent) {
    if (hasExplicitChoice()) return;
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    onChange();
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY) return;
    document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    onChange();
  }

  listeners.add(onChange);
  query.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(onChange);
    query.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}
