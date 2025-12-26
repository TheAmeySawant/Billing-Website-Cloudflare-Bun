import React, { useState, useEffect } from 'react';
import Header from './Header';
import ClientSection from './ClientSection';
import ProjectsGrid from './ProjectsGrid';
import Summary from './Summary';
import Payment from './Payment';
import Footer from './Footer';
import Marquee from './Marquee';
import Cursor from './Cursor';
import ProjectModal from './ProjectModal';
import DeleteModal from './DeleteModal';
import type { Project } from './ProjectCard';
import '../../styles/invoice.css'; // Import the CSS

const InvoiceManager: React.FC = () => {
    // --- State ---
    const [projects, setProjects] = useState<Project[]>([
        {
            id: 1,
            name: "Bundle Stack",
            type: "Banner Design",
            amount: 400,
            images: ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1170&auto=format&fit=crop&w=500&q=80"]
        },
        {
            id: 2,
            name: "Neon Vibes",
            type: "Thumbnail",
            amount: 350,
            images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500&q=80", "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop&w=500&q=80"]
        },
        {
            id: 3,
            name: "Retro Future",
            type: "Poster",
            amount: 500,
            images: ["https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop&w=500&q=80"]
        }
    ]);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDeleteId, setProjectToDeleteId] = useState<number | null>(null);

    const [scrollProgress, setScrollProgress] = useState(0);

    // --- Derived State ---
    const totalAmount = projects.reduce((sum, p) => sum + p.amount, 0);

    // Project Scope Text Generation
    const getProjectScopeText = () => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const type = p.type.split(' ')[0]; // "Banner Design" -> "Banner"
            counts[type] = (counts[type] || 0) + 1;
        });

        const scopeString = Object.entries(counts)
            .map(([type, count]) => `${count} ${type}`)
            .join(' & ');

        return scopeString || "No Projects";
    };

    // --- Effects ---
    // Scroll Progress
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.body.offsetHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setScrollProgress(scrollPercent);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- Actions ---
    const handleAddProject = (projectData: Omit<Project, 'id'> | Project) => {
        if ('id' in projectData) {
            // Edit
            setProjects(prev => prev.map(p => p.id === projectData.id ? projectData as Project : p));
        } else {
            // Add
            const newProject = { ...projectData, id: Date.now() };
            setProjects(prev => [newProject, ...prev]);
        }
    };

    const handleDeleteClick = (id: number) => {
        setProjectToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (projectToDeleteId) {
            setProjects(prev => prev.filter(p => p.id !== projectToDeleteId));
            setIsDeleteModalOpen(false);
            setProjectToDeleteId(null);
        }
    };

    const handleEditClick = (id: number) => {
        const project = projects.find(p => p.id === id);
        if (project) {
            setEditingProject(project);
            setIsProjectModalOpen(true);
        }
    };

    const openNewProjectModal = () => {
        setEditingProject(null);
        setIsProjectModalOpen(true);
    };

    return (
        <>
            <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>
            <Cursor />
            <div className="bg-grid"></div>

            <Marquee />

            <div className="container">
                <Header onOpenModal={openNewProjectModal} />

                <ClientSection projectScopeText={getProjectScopeText()} />

                <ProjectsGrid
                    projects={projects}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />

                <Summary totalItems={projects.length} totalAmount={totalAmount} />

                <Payment />

                <Footer />
            </div>

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSubmit={handleAddProject}
                initialData={editingProject}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </>
    );
};

export default InvoiceManager;
