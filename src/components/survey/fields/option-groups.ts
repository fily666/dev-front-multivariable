import type { QuestionOption } from '@/lib/survey-schema.types';

export interface OptionGroup {
  /** `null` en el grupo de opciones sueltas (p. ej. "Ninguna"). */
  code: string | null;
  label: string | null;
  options: QuestionOption[];
}

/**
 * Parte las opciones en los grupos que declara el catálogo, conservando el orden en que
 * llegaron. Las áreas vienen agrupadas por gestión: 24 subprocesos en una lista plana son
 * ilegibles, y la gestión es justamente la pista que el encuestado usa para ubicarse.
 *
 * Las opciones sin grupo (las estáticas, como "Ninguna") caen en un grupo sin título al
 * final, para que nunca queden escondidas bajo un encabezado que no les corresponde.
 */
export function groupOptions(options: QuestionOption[]): OptionGroup[] {
  const groups: OptionGroup[] = [];
  const byCode = new Map<string, OptionGroup>();
  let loose: OptionGroup | null = null;

  for (const option of options) {
    if (!option.group) {
      loose ??= { code: null, label: null, options: [] };
      loose.options.push(option);
      continue;
    }

    let group = byCode.get(option.group.code);
    if (!group) {
      group = { code: option.group.code, label: option.group.label, options: [] };
      byCode.set(option.group.code, group);
      groups.push(group);
    }
    group.options.push(option);
  }

  if (loose) groups.push(loose);
  return groups;
}

/** `true` cuando vale la pena pintar encabezados: hay más de un grupo con título. */
export function hasVisibleGroups(groups: OptionGroup[]): boolean {
  return groups.filter((group) => group.label !== null).length > 1;
}
