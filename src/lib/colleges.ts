export interface College {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const colleges: College[] = [
  { name: "Cornell University", primary: "0 80% 45%", secondary: "0 0% 100%", accent: "0 70% 55%" },
  { name: "UCLA", primary: "210 80% 45%", secondary: "45 95% 55%", accent: "210 70% 55%" },
  { name: "USC", primary: "0 80% 40%", secondary: "45 95% 50%", accent: "0 70% 50%" },
  { name: "Harvard University", primary: "0 75% 35%", secondary: "0 0% 10%", accent: "0 65% 45%" },
  { name: "Yale University", primary: "220 75% 30%", secondary: "0 0% 100%", accent: "220 65% 40%" },
  { name: "Stanford University", primary: "0 75% 40%", secondary: "0 0% 100%", accent: "0 65% 50%" },
  { name: "MIT", primary: "0 75% 40%", secondary: "0 0% 50%", accent: "0 65% 50%" },
  { name: "Princeton University", primary: "25 95% 50%", secondary: "0 0% 10%", accent: "25 85% 60%" },
  { name: "Duke University", primary: "220 75% 35%", secondary: "0 0% 100%", accent: "220 65% 45%" },
  { name: "Northwestern University", primary: "280 75% 30%", secondary: "0 0% 100%", accent: "280 65% 40%" },
  { name: "University of Michigan", primary: "45 95% 50%", secondary: "220 75% 30%", accent: "45 85% 60%" },
  { name: "Penn State", primary: "220 75% 30%", secondary: "0 0% 100%", accent: "220 65% 40%" },
  { name: "Ohio State", primary: "0 80% 40%", secondary: "0 0% 35%", accent: "0 70% 50%" },
  { name: "University of Texas", primary: "25 85% 45%", secondary: "0 0% 100%", accent: "25 75% 55%" },
  { name: "NYU", primary: "280 75% 35%", secondary: "0 0% 100%", accent: "280 65% 45%" },
  { name: "Boston University", primary: "0 80% 40%", secondary: "0 0% 100%", accent: "0 70% 50%" },
  { name: "Other", primary: "220 75% 50%", secondary: "0 0% 100%", accent: "220 65% 60%" },
];

export const categoryTemplates: Record<string, { name: string; size: string }[]> = {
  Bathroom: [
    { name: "Toothbrush", size: "Small" },
    { name: "Toothpaste", size: "Small" },
    { name: "Soap", size: "Small" },
    { name: "Shampoo", size: "Medium" },
    { name: "Conditioner", size: "Medium" },
    { name: "Towels", size: "Large" },
    { name: "Shower Caddy", size: "Medium" },
    { name: "Bathrobe", size: "Large" },
  ],
  Desk: [
    { name: "Laptop Stand", size: "Medium" },
    { name: "Pens", size: "Small" },
    { name: "Notebook", size: "Small" },
    { name: "Desk Lamp", size: "Medium" },
    { name: "Stapler", size: "Small" },
    { name: "Sticky Notes", size: "Small" },
    { name: "Desk Organizer", size: "Medium" },
  ],
  Bedding: [
    { name: "Mattress Topper", size: "XL" },
    { name: "Sheets", size: "Large" },
    { name: "Pillow", size: "Large" },
    { name: "Comforter", size: "XL" },
    { name: "Blanket", size: "Large" },
    { name: "Pillowcase", size: "Medium" },
  ],
  Electronics: [
    { name: "Laptop", size: "Medium" },
    { name: "Laptop Charger", size: "Small" },
    { name: "Phone Charger", size: "Small" },
    { name: "Power Strip", size: "Small" },
    { name: "Headphones", size: "Small" },
    { name: "HDMI Cable", size: "Small" },
  ],
  Clothing: [
    { name: "T-Shirts", size: "Medium" },
    { name: "Jeans", size: "Medium" },
    { name: "Socks", size: "Small" },
    { name: "Underwear", size: "Small" },
    { name: "Jacket", size: "Large" },
    { name: "Shoes", size: "Medium" },
  ],
  Kitchen: [
    { name: "Water Bottle", size: "Small" },
    { name: "Coffee Mug", size: "Small" },
    { name: "Snacks", size: "Medium" },
    { name: "Mini Fridge", size: "XL" },
    { name: "Microwave", size: "XL" },
  ],
};

export function inferItemSize(itemName: string): string {
  const name = itemName.toLowerCase();
  
  const xlItems = ['comforter', 'mattress', 'fridge', 'refrigerator', 'microwave', 'tv', 'television', 'futon'];
  const largeItems = ['pillow', 'blanket', 'towel', 'jacket', 'coat', 'backpack', 'laundry', 'sheets', 'lamp'];
  const smallItems = ['pen', 'pencil', 'toothbrush', 'toothpaste', 'soap', 'charger', 'cable', 'sticky', 'stapler', 'eraser', 'highlighter', 'scissors', 'tape', 'socks', 'underwear'];
  
  if (xlItems.some(item => name.includes(item))) return 'XL';
  if (largeItems.some(item => name.includes(item))) return 'Large';
  if (smallItems.some(item => name.includes(item))) return 'Small';
  
  return 'Medium';
}
