import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, DollarSign, Settings, Camera, Plus, Minus, Calculator, Calendar } from 'lucide-react';

const Sidebar = () => {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isHppOpen, setIsHppOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '1rem auto 2.5rem', textAlign: 'center', gap: '0.75rem' }}>
        <img src="/logo.png" alt="Lakiphoto Logo" style={{ height: '55px', objectFit: 'contain', background: 'white', padding: '0.2rem', borderRadius: '0.5rem' }} />
        <div style={{ fontSize: '1.1rem', lineHeight: '1.2', color: 'var(--text-main)' }}>Data Base<br /><span style={{ color: '#0ea5e9', fontSize: '1.2rem', fontWeight: 'bold' }}>Lakiphoto</span></div>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/job-laki" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Calendar size={20} /> Job Laki
        </NavLink>
        <NavLink to="/dashboard/wedding" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard Wedding
        </NavLink>
        <NavLink to="/dashboard/studio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard Studio
        </NavLink>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsInputOpen(!isInputOpen)}>
              <FilePlus size={20} /> Input Transaksi
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsInputOpen(!isInputOpen); }}>
              {isInputOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isInputOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              <NavLink to="/input" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`}>
                Form Transaksi
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Riwayat</div>
              <NavLink to="/data/wedding" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Wedding
              </NavLink>
              <NavLink to="/data/studio" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Studio
              </NavLink>
            </div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsFinanceOpen(!isFinanceOpen)}>
              <DollarSign size={20} /> Finance
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsFinanceOpen(!isFinanceOpen); }}>
              {isFinanceOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isFinanceOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              
              <NavLink to="/finance" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`}>
                Input Finance (Form)
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wedding</div>
              <NavLink to="/finance/wedding/data" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Data Finance
              </NavLink>
              <NavLink to="/finance/wedding/pnl" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                PNL Wedding
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Studio</div>
              <NavLink to="/finance/studio/data" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Data Finance
              </NavLink>
              <NavLink to="/finance/studio/pnl" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                PNL Studio
              </NavLink>

            </div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-link-wrapper">
            <div className="nav-link" style={{ flex: 1, cursor: 'pointer', paddingRight: 0 }} onClick={() => setIsHppOpen(!isHppOpen)}>
              <Calculator size={20} /> HPP Laki
            </div>
            <button className="toggle-btn" onClick={(e) => { e.preventDefault(); setIsHppOpen(!isHppOpen); }}>
              {isHppOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          <div className={`sub-menu-container ${isHppOpen ? 'open' : ''}`}>
            <div className="sub-menu-inner" style={{ gap: '0.5rem' }}>
              
              <div style={{ padding: '0.2rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wedding</div>
              <NavLink to="/hpp/wedding/bahan-baku" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Bahan Baku Utama
              </NavLink>
              <NavLink to="/hpp/wedding/produk" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                HPP Produk
              </NavLink>
              <NavLink to="/hpp/wedding/price-book" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Price Book Wedding
              </NavLink>

              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Studio</div>
              <NavLink to="/hpp/studio/bahan-baku" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Bahan Baku Utama
              </NavLink>
              <NavLink to="/hpp/studio/produk" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                HPP Produk
              </NavLink>
              <NavLink to="/hpp/studio/price-book" className={({ isActive }) => `nav-link nav-link-sub ${isActive ? 'active' : ''}`} style={{ paddingLeft: '2rem' }}>
                Price Book Studio
              </NavLink>

            </div>
          </div>
        </div>

        <NavLink to="/setting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} /> Setting
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
