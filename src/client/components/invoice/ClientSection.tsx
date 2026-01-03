import React from 'react';

interface ClientSectionProps {
    clientName: string;
    clientDescription: string;
    projectScopeText: string;
    month: string;
    year: string;
}

const ClientSection: React.FC<ClientSectionProps> = ({ clientName, clientDescription, projectScopeText, month, year }) => {
    return (
        <section className="client-section">
            <div className="info-block">
                <h2>Billed To</h2>
                <h3>{clientName}</h3>
                <p>{clientDescription || "Client"}</p>
            </div>
            <div className="info-block right-align">
                <h2>Project Scope</h2>
                <h3>{projectScopeText}</h3>
                <p>{month} {year} Cycle</p>
            </div>
        </section>
    );
};

export default ClientSection;
