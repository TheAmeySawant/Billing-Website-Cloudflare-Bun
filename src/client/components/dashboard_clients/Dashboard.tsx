import { useState } from 'react';
import Controls from './Controls';
import ClientGrid from './ClientGrid';
import NewClientModal from './NewClientModal';

const INITIAL_CLIENTS = [
    {
        id: 1,
        title: "Dark Winter",
        description: "Music Production and Bundle design for the winter season cycle.",
        code: "#DW003",
        image: "https://placehold.co/400x300/333333/ccff00?text=Dark+Winter"
    },
    {
        id: 2,
        title: "Neon Tech Systems",
        description: "Full branding identity and website overhaul for tech startup.",
        code: "#NT092",
        image: "https://placehold.co/400x300/333333/ccff00?text=Neon+Tech"
    },
    {
        id: 3,
        title: "Vortex Gaming",
        description: "Esports tournament assets and social media headers.",
        code: "#VX118",
        image: "https://placehold.co/400x300/333333/ccff00?text=Vortex"
    }
];

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState(INITIAL_CLIENTS);

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
            />
        </>
    );
}
