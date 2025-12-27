import React, { useState } from 'react';

interface HeaderProps {
  onOpenModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenModal }) => {
  const [shareBtnText, setShareBtnText] = useState('Share');
  const [shareBtnStyle, setShareBtnStyle] = useState({});
  const [status, setStatus] = useState<'PENDING' | 'PAID'>('PENDING');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareBtnText("Copied!");
      setShareBtnStyle({ background: "var(--accent)", color: "#000" });

      setTimeout(() => {
        setShareBtnText("Share");
        setShareBtnStyle({});
      }, 2000);
    });
  };

  return (
    <header>
      <div className="brand">
        <h1>dzynsby<br />soham</h1>
        <span>CREATIVE SERVICES</span>
      </div>
      <div className="invoice-meta">
        <div className="tag">#DW003</div>
        <p>November | 2025</p>

        <div
          className="status-toggle-container"
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}
        >
          <span style={{ fontSize: '1rem', color: '#888' }}>Status:</span>
          <button
            onClick={() => setStatus((prev: 'PENDING' | 'PAID') => prev === 'PENDING' ? 'PAID' : 'PENDING')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '30px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              width: '120px',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
            className="status-toggle-btn"
          >
            <div
              style={{
                position: 'absolute',
                left: status === 'PENDING' ? '4px' : 'calc(100% - 24px)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: status === 'PENDING' ? '#ff4d4d' : 'var(--accent)',
                boxShadow: `0 0 10px ${status === 'PENDING' ? 'rgba(255, 77, 77, 0.5)' : 'var(--accent-glow)'}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
              }}
            />
            <span
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: status === 'PENDING' ? '#ff4d4d' : 'var(--accent)',
                letterSpacing: '1px'
              }}
            >
              {status}
            </span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            className="btn-new-project"
            style={{ marginTop: 0, ...shareBtnStyle }}
            onClick={handleShare}
          >
            {shareBtnText}
          </button>
          <button
            className="btn-new-project"
            style={{ marginTop: 0 }}
            onClick={onOpenModal}
          >
            + New Project
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
