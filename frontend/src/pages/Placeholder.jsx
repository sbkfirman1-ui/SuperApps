import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

const Placeholder = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ').toUpperCase() || 'Page';

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center h-full text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
      <div className="glass-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
        <Construction size={64} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h2 className="page-title">{pageName}</h2>
        <p className="page-subtitle">
          This page is currently under construction. Please check back later!
        </p>
      </div>
    </div>
  );
};

export default Placeholder;
