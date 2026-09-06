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
  { id: 1, name: 'DP Klien', type: 'Pemasukan' },
  { id: 2, name: 'Pelunasan Klien', type: 'Pemasukan' },
  { id: 3, name: 'Pembelian Aset / Alat', type: 'Pengeluaran' },
  { id: 4, name: 'Gaji Karyawan', type: 'Pengeluaran' },
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
