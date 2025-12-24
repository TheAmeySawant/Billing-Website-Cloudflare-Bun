
interface ClientData {
    name: string;
    description: string;
}

interface ClientSectionProps {
    totalInvoices: number;
    totalEarnings: number;
    clientData: ClientData;
    onEdit: () => void;
}

export default function ClientSection({ totalInvoices, totalEarnings, clientData, onEdit }: ClientSectionProps) {
    return (
        <section className="client-section">
            <div className="info-block">
                <h2>Client</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{clientData.name}</h3>
                    <button
                        onClick={onEdit}
                        style={{
                            background: 'transparent',
                            border: '1px solid #666',
                            color: '#666',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            cursor: 'none',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-main)'
                        }}
                    >
                        Edit
                    </button>
                </div>
                <p>{clientData.description}</p>
            </div>
            <div className="info-block right-align">
                <h2>Total Invoices</h2>
                <h3>{totalInvoices}</h3>
                <div style={{ marginTop: '1rem' }}>
                    <h2>Total Earnings</h2>
                    <h3>${totalEarnings}</h3>
                </div>
            </div>
        </section>
    );
}
