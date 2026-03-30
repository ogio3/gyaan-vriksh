import type { BranchType, BloomLevel } from './database';

export type CardRarity = 'N' | 'R' | 'SR' | 'SSR';

export interface TreeNode {
  id: string;
  label: string;
  branchType?: BranchType;
  bloomLevel?: BloomLevel;
  summary?: string;
  rarity?: CardRarity;
  children?: TreeNode[];
}
