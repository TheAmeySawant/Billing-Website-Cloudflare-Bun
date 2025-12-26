import React, { useState } from 'react';

interface HeaderProps {
  onOpenModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenModal }) => {
  const [shareBtnText, setShareBtnText] = useState('Share');
  const [shareBtnStyle, setShareBtnStyle] = useState({});

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
        <p>Status: <span style={{ color: 'var(--accent)' }}>PENDING</span></p>
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
