import React from 'react';

interface SummaryProps {
    totalItems: number;
    totalAmount: number;
}

const Summary: React.FC<SummaryProps> = ({ totalItems, totalAmount }) => {
    return (
        <div className="summary-section">
            <div className="summary-text">
                <div className="total-label">Total Due</div>
                <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    {totalItems} Items @ ₹{totalAmount}
                </div>
            </div>
            <div className="total-amount">₹{totalAmount}</div>
        </div>
    );
};

export default Summary;
