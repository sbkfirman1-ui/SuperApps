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
  // Pendapatan
  { id: 1, name: 'Job Wedding', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 2, name: 'Job Studio', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 3, name: 'Job Prewedding', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 4, name: 'Job Siraman dll', type: 'Pemasukan', group: 'Pendapatan' },
  { id: 5, name: 'Job Wisuda', type: 'Pemasukan', group: 'Pendapatan' },
  // Beban Operasional
  { id: 6, name: 'Biaya Transport', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 7, name: 'Biaya Gaji', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 8, name: 'Biaya Upah Freelance', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 9, name: 'Biaya Marketing', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 10, name: 'Biaya Sewa Kamera', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 11, name: 'Biaya Capex', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 12, name: 'Biaya Maintenance', type: 'Pengeluaran', group: 'Beban Operasional' },
  { id: 13, name: 'Bonus Pegawai', type: 'Pengeluaran', group: 'Beban Operasional' },
  // Beban Tetap
  { id: 14, name: 'Biaya Wifi', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 15, name: 'Biaya Listrik', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 16, name: 'Biaya Cetak Magazine', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 17, name: 'Biaya Cetak Album', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 18, name: 'Biaya Cetak', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 19, name: 'Biaya Sewa Studio', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 20, name: 'Biaya Flashdisk', type: 'Pengeluaran', group: 'Beban Tetap' },
  { id: 21, name: 'Pajak', type: 'Pengeluaran', group: 'Beban Tetap' },
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
