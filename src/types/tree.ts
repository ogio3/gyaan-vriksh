import type { BranchType, BloomLevel } from './database';

export interface TreeNode {
  id: string;
  label: string;
  branchType?: BranchType;
  bloomLevel?: BloomLevel;
  summary?: string;
  children?: TreeNode[];
}
