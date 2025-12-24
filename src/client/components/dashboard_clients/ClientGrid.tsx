import ClientCard from './ClientCard';

interface Client {
    id: number;
    title: string;
    description: string;
    code: string;
    image: string;
}

interface ClientGridProps {
    clients: Client[];
}

export default function ClientGrid({ clients }: ClientGridProps) {
    return (
        <div>
            <h2 className="section-header" style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: '2rem',
                borderLeft: '4px solid var(--accent)',
                paddingLeft: '1rem'
            }}>Clients</h2>

            <div className="clients-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {clients.map(client => (
                    <ClientCard
                        key={client.id}
                        image={client.image}
                        title={client.title}
                        description={client.description}
                        code={client.code}
                    />
                ))}
            </div>
        </div>
    );
}
