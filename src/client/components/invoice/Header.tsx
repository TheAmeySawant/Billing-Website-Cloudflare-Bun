import React, { useState } from 'react';

interface HeaderProps {
  onOpenModal: () => void;
  clientId: string; // Required for updates
  clientCode?: string;
  month: string;
  year: string;
  status: string;
  isLoading?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenModal, clientId, clientCode, month, year, status: initialStatus, isLoading }) => {
  const [shareBtnText, setShareBtnText] = useState('Share');
  const [shareBtnStyle, setShareBtnStyle] = useState({});
  const [status, setStatus] = useState<'PENDING' | 'PAID'>(initialStatus.toUpperCase() as 'PENDING' | 'PAID');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state if prop changes
  React.useEffect(() => {
    setStatus(initialStatus.toUpperCase() as 'PENDING' | 'PAID');
  }, [initialStatus]);

  const toggleStatus = async () => {
    if (isUpdating) return;
    const newStatus = status === 'PENDING' ? 'PAID' : 'PENDING';

    setIsUpdating(true);
    try {
      const res = await fetch("/api/update/invoice-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          month,
          year,
          status: newStatus
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(newStatus);
      } else {
        console.error("Failed to update status:", data.error);
        alert("Failed to update status: " + (data.error || "Unknown error"));
      }

    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShare = () => {
    const newBase = "https://dzynsbysoham.amey01962.workers.dev";
    const targetUrl = newBase + window.location.pathname + window.location.search;

    navigator.clipboard.writeText(targetUrl).then(() => {
      setShareBtnText("Copied!");
      // ... same logic
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
        {isLoading ? (
          <>
            <div className="tag skeleton" style={{ width: '80px', height: '24px', border: 'none' }}></div>
            <p className="skeleton" style={{ width: '120px', height: '20px', marginTop: '0.5rem' }}></p>
            <div className="status-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <span className="skeleton" style={{ width: '50px', height: '20px' }}></span>
              <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '30px' }}></div>
            </div>
          </>
        ) : (
          <>
            <div className="tag">{clientCode || "#CLIENT"}</div>
            <p>{month} | {year}</p>

            <div
              className="status-toggle-container"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}
            >
              <span style={{ fontSize: '1rem', color: '#888' }}>Status:</span>
              <button
                onClick={toggleStatus}
                disabled={isUpdating}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '30px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  width: '120px',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  opacity: isUpdating ? 0.7 : 1,
                  cursor: isUpdating ? 'wait' : 'pointer'
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
                  {isUpdating ? '...' : status}
                </span>
              </button>
            </div>
          </>
        )}
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
