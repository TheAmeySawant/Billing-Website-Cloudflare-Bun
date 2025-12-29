import { useState, useEffect } from 'react';
import Controls from './Controls';
import ClientGrid from './ClientGrid';
import NewClientModal from './NewClientModal';

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

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
        // Implement search logic if needed, or just console log
        console.log("Searching for:", query);
    };

    return (
        <>
            <Controls
                onSearch={handleSearch}
                onNewClient={() => setIsModalOpen(true)}
            />

            <ClientGrid clients={clients} />

            <NewClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchClients}
            />
        </>
    );
}
