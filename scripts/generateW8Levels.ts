import { generateLevel } from '../lib/levelGenerator';
import type { Level } from '../lib/types';

const W8_LEVELS: Level[] = [];

for (let levelNum = 1; levelNum <= 30; levelNum++) {
  const level = generateLevel(8, levelNum);
  W8_LEVELS.push(level);
}

process.stdout.write(JSON.stringify(W8_LEVELS));
