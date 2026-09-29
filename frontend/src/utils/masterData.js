export const DEFAULT_WEDDING_PRODUCTS = [
  { id: 1, name: 'Prewedding Cinematic', price: 5500000, isActive: true },
  { id: 2, name: 'Wedding Documentation Basic', price: 8000000, isActive: true },
  { id: 3, name: 'Wedding Full Package Premium', price: 15000000, isActive: true },
];

export const DEFAULT_STUDIO_PRODUCTS = [
  { id: 1, name: 'Studio Family Portrait', price: 1200000, isActive: true },
  { id: 2, name: 'Graduation Package', price: 850000, isActive: true },
  { id: 3, name: 'Maternity Session', price: 1500000, isActive: true },
];

export const DEFAULT_FINANCE_CATEGORIES = [
  // Pendapatan Wedding
  { id: 1, name: 'Job Wedding Klien', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 2, name: 'Job Wedding Vendor', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 3, name: 'Job Wedding Other', type: 'Pemasukan', group: 'Pendapatan' },
  // Pendapatan Studio
  { id: 4, name: 'Job Studio LB', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 5, name: 'Job Studio Prewed', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 6, name: 'Job Studio Maternity', type: 'Pemasukan', group: 'Pendapatan' },
  // Legacy / Default
  { id: 7, name: 'Job Wedding', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 8, name: 'Job Prewedding', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 9, name: 'Job Siraman dll', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 10, name: 'Job Wisuda', type: 'Pemasukan', group: 'Pendapatan' },
  // COGS
  { id: 6, name: 'Biaya Transport', type: 'Pengeluaran', group: 'COGS' },
  { id: 7, name: 'Biaya Gaji', type: 'Pengeluaran', group: 'COGS' },
  { id: 8, name: 'Biaya Upah Freelance', type: 'Pengeluaran', group: 'COGS' },
  { id: 9, name: 'Biaya Marketing', type: 'Pengeluaran', group: 'COGS' },
  { id: 10, name: 'Biaya Sewa Kamera', type: 'Pengeluaran', group: 'COGS' },
  { id: 11, name: 'Biaya Capex', type: 'Pengeluaran', group: 'COGS' },
  { id: 12, name: 'Biaya Maintenance', type: 'Pengeluaran', group: 'COGS' },
  { id: 13, name: 'Bonus Pegawai', type: 'Pengeluaran', group: 'COGS' },
  // Fixed Cost
  { id: 14, name: 'Biaya Wifi', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 15, name: 'Biaya Listrik', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 16, name: 'Biaya Cetak Magazine', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 17, name: 'Biaya Cetak Album', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 18, name: 'Biaya Cetak', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 19, name: 'Biaya Sewa Studio', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 20, name: 'Biaya Flashdisk', type: 'Pengeluaran', group: 'Fixed Cost' },
  { id: 21, name: 'Pajak', type: 'Pengeluaran', group: 'Fixed Cost' },
];

export const getMasterData = (key, defaultData) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch (error) {
    console.error("Error reading localStorage", error);
    return defaultData;
  }
};

export const setMasterData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage", error);
  }
};
