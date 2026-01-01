import { useState, useRef, useEffect } from 'react';
import '../../styles/header.css';

export default function Header() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target?.result) {
                    const result = e.target.result as string;
                    setQrCode(result);

                    try {
                        const response = await fetch('/api/new/qrcode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: result })
                        });

                        if (!response.ok) {
                            alert("Failed to upload QR code");
                        }
                    } catch (error) {
                        console.error("Error uploading QR code:", error);
                        alert("Error uploading QR code");
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <header className="dashboard-header">
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
            <div className="brand">
                <h1 className="brand-title">
                    dzynsby<br />soham
                </h1>
                <span className="brand-subtitle">
                    CLIENT DASHBOARD
                </span>
            </div>

            <div className="header-right">
                <div className="qr-code-container">
                    {isLoading ? (
                        <div className="qr-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <img
                            src={qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=dzynsbysoham@upi"}
                            alt="QR Code"
                            className="qr-code"
                        />
                    )}
                </div>
                <label className="upload-btn-label">
                    Upload
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </header>
    );
}
