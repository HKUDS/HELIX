import { sum } from "./math";

export function calculateTotal(values: number[]): number {
  return values.reduce((total, value) => sum(total, value), 0);
}
