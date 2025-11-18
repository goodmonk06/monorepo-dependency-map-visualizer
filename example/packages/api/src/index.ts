import { capitalize } from '@example/utils';

export function fetchUser(id: string) {
  return { id, name: capitalize('john') };
}
