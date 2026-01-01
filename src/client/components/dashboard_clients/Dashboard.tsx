import { useState, useEffect } from 'react';
import Controls from './Controls';
import ClientGrid from './ClientGrid';
import NewClientModal from './NewClientModal';

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (response.ok) {
                const responseData = await response.json();
                // Map the API data to the UI structure
                // The API returns { success: true, data: [...] }
                const mappedClients = (responseData.data || []).map((client: any) => ({
                    id: client.id,
                    title: client.name,
                    description: client.description || "",
                    code: client.code || "",
                    // Generate placeholder image based on title
                    image: `https://placehold.co/400x300/333333/ccff00?text=${encodeURIComponent(client.name)}`
                }));
                setClients(mappedClients);
            } else {
                console.error("Failed to fetch clients");
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const filteredClients = clients
        .map(client => {
            const query = searchQuery.toLowerCase();
            const titleMatch = client.title.toLowerCase().includes(query);
            const codeMatch = client.code.toLowerCase().includes(query);
            const descMatch = client.description.toLowerCase().includes(query);

            let priority = Infinity;
            if (titleMatch) priority = 1;
            else if (codeMatch) priority = 2;
            else if (descMatch) priority = 3;

            return { ...client, priority };
        })
        .filter(client => client.priority !== Infinity)
        .sort((a, b) => a.priority - b.priority);

    return (
        <>
            <Controls
                onSearch={handleSearch}
                onNewClient={() => setIsModalOpen(true)}
            />

            <ClientGrid clients={filteredClients} />

            <NewClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClients}
            />
        </>
    );
}
