import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
