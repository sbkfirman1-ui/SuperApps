import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import InputTransaksi from './pages/InputTransaksi';
import Wedding from './pages/Wedding';
import Studio from './pages/Studio';
import InputFinance from './pages/InputFinance';
import FinanceData from './pages/FinanceData';
import HppBahanBaku from './pages/HppBahanBaku';
import HppProduk from './pages/HppProduk';
import Setting from './pages/Setting';
import JobLaki from './pages/JobLaki';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard category="General" />} />
          <Route path="job-laki" element={<JobLaki />} />
          <Route path="dashboard/wedding" element={<Dashboard category="Wedding" />} />
          <Route path="dashboard/studio" element={<Dashboard category="Studio" />} />
          <Route path="input" element={<InputTransaksi />} />
          <Route path="data/wedding" element={<Wedding />} />
          <Route path="data/studio" element={<Studio />} />
          <Route path="finance" element={<InputFinance />} />
          <Route path="finance-data/wedding" element={<FinanceData category="Wedding" />} />
          <Route path="finance-data/studio" element={<FinanceData category="Studio" />} />
          <Route path="hpp/wedding/bahan-baku" element={<HppBahanBaku category="Wedding" />} />
          <Route path="hpp/wedding/produk" element={<HppProduk category="Wedding" />} />
          <Route path="hpp/studio/bahan-baku" element={<HppBahanBaku category="Studio" />} />
          <Route path="hpp/studio/produk" element={<HppProduk category="Studio" />} />
          <Route path="setting" element={<Setting />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
