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
        <div className="client-grid-section">
            <h2 className="section-title">
                Clients
            </h2>

            <div className="client-grid">
                {clients.map(client => (
                    <ClientCard
                        key={client.id}
                        id={client.id}
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
