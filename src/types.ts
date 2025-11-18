export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface TreeNode {
  id: string;
  name: string;
  description?: string;
  isApplication?: boolean;
  link?: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // Used to store collapsed children
  quiz?: Quiz;
}