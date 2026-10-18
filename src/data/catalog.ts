import products from './products.json';
import distributors from './distributors.json';

export type Product = (typeof products)[number];
export type Category = 'sol' | 'mur' | 'plinthe';

export const categories: Record<Category, { label: string; short: string; text: string }> = {
  sol: {
    label: 'Carreaux de sol',
    short: 'Sols',
    text: 'Grès cérame pleine masse, résistant à l’usure et au gel, pour l’intérieur comme l’extérieur.',
  },
  mur: {
    label: 'Faïence murale',
    short: 'Murs',
    text: 'Faïences émaillées pour cuisines, salles de bain et murs décoratifs.',
  },
  plinthe: {
    label: 'Plinthes',
    short: 'Plinthes',
    text: 'Plinthes assorties pour une finition nette entre le sol et le mur.',
  },
};

export { products, distributors };
export const unique = (key: keyof Product) => [...new Set(products.map((p) => String(p[key])))].sort((a, b) => a.localeCompare(b, 'fr'));
