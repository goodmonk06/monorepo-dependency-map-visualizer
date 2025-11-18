import { formatDate } from '@example/utils';

export function Button() {
  console.log(formatDate(new Date()));
  return 'Button';
}
