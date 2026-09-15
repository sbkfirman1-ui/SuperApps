const financeCategories = [
  { name: 'Job Studio LB', type: 'Pemasukan', group: 'Pendapatan' },
  { name: 'Job Studio Prewed', type: 'Pemasukan', group: 'Pendapatan' },
  { name: 'Job Wedding Klien', type: 'Pemasukan', group: 'Pendapatan' },
  { name: 'Job Wedding Vendor', type: 'Pemasukan', group: 'Pendapatan' }
];

const category = 'Wedding';

let groupCats = financeCategories.filter(cat => cat.group === 'Pendapatan');
groupCats = groupCats.filter(cat => {
  const lowerName = cat.name.toLowerCase();
  if (category === 'Wedding' && lowerName.includes('studio')) return false;
  if (category === 'Studio' && lowerName.includes('wedding')) return false;
  return true;
});

console.log("Wedding Pendapatan categories:", groupCats.map(c => c.name));

let groupCatsStudio = financeCategories.filter(cat => cat.group === 'Pendapatan');
groupCatsStudio = groupCatsStudio.filter(cat => {
  const lowerName = cat.name.toLowerCase();
  if ('Studio' === 'Wedding' && lowerName.includes('studio')) return false;
  if ('Studio' === 'Studio' && lowerName.includes('wedding')) return false;
  return true;
});

console.log("Studio Pendapatan categories:", groupCatsStudio.map(c => c.name));
