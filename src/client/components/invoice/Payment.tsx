import React, { useState, useEffect } from 'react';

const Payment: React.FC = () => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQrCode = async () => {
            try {
                const response = await fetch('/api/qrcode');
                if (response.ok) {
                    const blob = await response.blob();
                    setQrCode(URL.createObjectURL(blob));
                }
            } catch (error) {
                console.error("Error fetching QR code:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQrCode();
    }, []);

    return (
        <div className="payment-section">
            <style>{`
                .qr-loading {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: var(--surface);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-radius: 50%;
                    border-top-color: var(--accent);
                    animation: spin 1s ease-in-out infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div className="qr-code-container">
                {isLoading ? (
                    <div className="qr-loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <img
                        src={qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=dzynsbysoham@upi"}
                        alt="UPI QR"
                        className="qr-code"
                    />
                )}
            </div>
            <div className="payment-info">
                <h3>Scan to Pay</h3>
                <p style={{ color: '#aaa' }}>Use any UPI app to complete payment.</p>
                <button className="btn-download" onClick={() => window.print()}>Download Invoice</button>
            </div>
        </div>
    );
};

export default Payment;
