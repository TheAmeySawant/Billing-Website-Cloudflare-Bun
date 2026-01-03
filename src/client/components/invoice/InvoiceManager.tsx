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
    // --- State ---
    const [projects, setProjects] = useState<Project[]>([]);

    // Dynamic Data State
    const [clientData, setClientData] = useState({ name: "", description: "", code: "" });
    const [invoiceMeta, setInvoiceMeta] = useState({ month: "", year: "", status: "Pending" });
    const [isLoading, setIsLoading] = useState(true);

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
    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            const params = new URLSearchParams(window.location.search);
            const clientId = params.get('clientId');
            const monthParam = params.get('month'); // YYYYMM

            if (!clientId || !monthParam) {
                // Determine if we should redirect or show error. For now, empty or error.
                console.error("Missing params");
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch Client & Invoice Details
                const detailsRes = await fetch(`/api/invoice-details?clientId=${clientId}&month=${monthParam}`);
                if (detailsRes.ok) {
                    const { data } = await detailsRes.json();

                    // Parse Month/Year from YYYYMM
                    const yearStr = monthParam.substring(0, 4);
                    const monthInt = parseInt(monthParam.substring(4, 6), 10);
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
                    const monthName = (monthInt >= 1 && monthInt <= 12) ? monthNames[monthInt - 1] : monthParam;

                    setClientData({
                        name: data.client.name,
                        description: data.client.description || "",
                        code: data.client.code
                    });

                    setInvoiceMeta({
                        month: monthName,
                        year: yearStr,
                        status: data.invoice.payment_status || "Pending"
                    });
                }

                // 2. Fetch Projects
                const projectsRes = await fetch(`/api/invoice-projects?clientId=${clientId}&month=${monthParam}`);
                if (projectsRes.ok) {
                    const { data } = await projectsRes.json();
                    // Maps backend project to frontend Project interface
                    // Backend returns: { id, name, project_type (as type), price (as amount), images: string[] }
                    // Frontend Project interface expects: id, name, type, amount, images

                    const mappedProjects = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        type: p.project_type,
                        amount: p.price,
                        images: p.images || []
                    }));

                    setProjects(mappedProjects);
                }

            } catch (error) {
                console.error("Error fetching invoice data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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
            // Edit Local State (Ideally update backend too)
            // Note: Since the prompt is about "navigation" and "fetching", implementing full CRUD for *items* 
            // inside the invoice page might be out of scope or require more API routes.
            // For now, I will update local state. The user prompt says "create separate routes for fetching... so that projects... can be updated dynamically". 
            // It doesn't explicitly ask for CRUD implementation on the backend for projects (insert/update/delete).
            // However, normally "updated dynamically" implies fetching.
            // I'll keep local state update logic for now. 
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

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#fff' }}>
                Loading Invoice...
            </div>
        );
    }

    return (
        <>
            <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}></div>
            <Cursor />
            <div className="bg-grid"></div>

            <Marquee />

            <div className="container">
                <Header
                    onOpenModal={openNewProjectModal}
                    clientCode={clientData.code}
                    month={invoiceMeta.month}
                    year={invoiceMeta.year}
                    status={invoiceMeta.status}
                />

                <ClientSection
                    projectScopeText={getProjectScopeText()}
                    clientName={clientData.name}
                    clientDescription={clientData.description}
                    month={invoiceMeta.month}
                    year={invoiceMeta.year}
                />

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
