import React from 'react';

interface ClientSectionProps {
    clientName: string;
    clientDescription: string;
    projectScopeText: string;
    month: string;
    year: string;
    isLoading?: boolean;
}

const ClientSection: React.FC<ClientSectionProps> = ({ clientName, clientDescription, projectScopeText, month, year, isLoading }) => {
    return (
        <section className="client-section">
            <div className="info-block">
                <h2>Billed To</h2>
                {isLoading ? (
                    <>
                        <h3 className="skeleton" style={{ width: '200px', height: '1.8rem', marginBottom: '0.5rem' }}></h3>
                        <p className="skeleton" style={{ width: '150px', height: '1rem' }}></p>
                    </>
                ) : (
                    <>
                        <h3>{clientName}</h3>
                        <p>{clientDescription || "Client"}</p>
                    </>
                )}
            </div>
            <div className="info-block right-align">
                <h2>Project Scope</h2>
                {isLoading ? (
                    <>
                        <h3 className="skeleton" style={{ width: '180px', height: '1.8rem', marginBottom: '0.5rem', alignSelf: 'flex-end' }}></h3>
                        <p className="skeleton" style={{ width: '120px', height: '1rem', alignSelf: 'flex-end' }}></p>
                    </>
                ) : (
                    <>
                        <h3>{projectScopeText}</h3>
                        <p>{month} {year} Cycle</p>
                    </>
                )}
            </div>
        </section>
    );
};

export default ClientSection;
