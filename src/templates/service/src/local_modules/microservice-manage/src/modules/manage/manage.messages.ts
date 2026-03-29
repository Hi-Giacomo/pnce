const MSG_PREFIX = 'manage';

function msg(pattern: string): string {
  return `${MSG_PREFIX}.${pattern}`;
}

export const MSG = {
  world: msg('world'),
  start: msg('start'),
} as const;
