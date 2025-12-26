import React from 'react';

const Payment: React.FC = () => {
    return (
        <div className="payment-section">
            <div className="qr-code-container">
                <img src="https://imgs.search.brave.com/KBxaYr5s34bI0YBjvqi4S-GWA-TzTOk-63xjWqY6U-g/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTM0/NzI3NzU2Ny92ZWN0/b3IvcXItY29kZS1z/YW1wbGUtZm9yLXNt/YXJ0cGhvbmUtc2Nh/bm5pbmctb24td2hp/dGUtYmFja2dyb3Vu/ZC5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9UFloV0haN2JN/RUNHWjFmWnppXy1p/czBycDRaUTdhYnhi/ZEhfZm04U1A3UT0" alt="UPI QR" className="qr-code" />
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
