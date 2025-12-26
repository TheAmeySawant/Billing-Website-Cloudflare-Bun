import React from 'react';

interface ClientSectionProps {
    projectScopeText: string;
}

const ClientSection: React.FC<ClientSectionProps> = ({ projectScopeText }) => {
    return (
        <section className="client-section">
            <div className="info-block">
                <h2>Billed To</h2>
                <h3>Dark Winter</h3>
                <p>Music Production and Bundle</p>
            </div>
            <div className="info-block right-align">
                <h2>Project Scope</h2>
                <h3>{projectScopeText}</h3>
                <p>November 2025 Cycle</p>
            </div>
        </section>
    );
};

export default ClientSection;
