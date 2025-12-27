import { useState, useRef } from 'react';
import '../../styles/header.css';

export default function Header() {
    const [qrCode, setQrCode] = useState<string>("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Example");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setQrCode(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <header className="dashboard-header">
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
                    <img src={qrCode} alt="QR Code" className="qr-code" />
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
