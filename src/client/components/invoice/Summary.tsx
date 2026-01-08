import React from 'react';

interface SummaryProps {
    totalItems: number;
    totalAmount: number;
    isLoading?: boolean;
}

const Summary: React.FC<SummaryProps> = ({ totalItems, totalAmount, isLoading }) => {
    return (
        <div className="summary-section">
            <div className="summary-text">
                <div className="total-label">Total Due</div>
                <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    {isLoading ? (
                        <div className="skeleton" style={{ width: '150px', height: '1.2rem' }}></div>
                    ) : (
                        `${totalItems} Items @ ₹${totalAmount}`
                    )}
                </div>
            </div>
            <div className="total-amount">
                {isLoading ? (
                    <div className="skeleton" style={{ width: '200px', height: '4rem' }}></div>
                ) : (
                    `₹${totalAmount}`
                )}
            </div>
        </div>
    );
};

export default Summary;
