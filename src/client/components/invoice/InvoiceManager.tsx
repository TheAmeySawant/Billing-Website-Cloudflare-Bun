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

    // Query Params
    const [queryParams, setQueryParams] = useState<{ clientId: string | null; month: string | null }>({ clientId: null, month: null });

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

            setQueryParams({ clientId, month: monthParam });

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
            // Check if it exists in current state
            const exists = projects.some(p => p.id === projectData.id);

            if (exists) {
                // Edit Local State
                setProjects(prev => prev.map(p => p.id === projectData.id ? projectData as Project : p));
            } else {
                // New Project (ID provided by backend)
                setProjects(prev => [projectData as Project, ...prev]);
            }
        } else {
            // Add (Fallback for local ID generation)
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
                <Header
                    onOpenModal={openNewProjectModal}
                    clientId={queryParams.clientId || ''}
                    clientCode={clientData.code}
                    month={invoiceMeta.month}
                    year={invoiceMeta.year}
                    status={invoiceMeta.status}
                    isLoading={isLoading}
                />

                <ClientSection
                    projectScopeText={getProjectScopeText()}
                    clientName={clientData.name}
                    clientDescription={clientData.description}
                    month={invoiceMeta.month}
                    year={invoiceMeta.year}
                    isLoading={isLoading}
                />

                <ProjectsGrid
                    projects={projects}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    isLoading={isLoading}
                />

                <Summary
                    totalItems={projects.length}
                    totalAmount={totalAmount}
                    isLoading={isLoading}
                />

                <Payment />

                <Footer />
            </div>

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSubmit={handleAddProject}
                initialData={editingProject}
                clientId={queryParams.clientId}
                invoiceId={queryParams.month}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                projectId={projectToDeleteId}
            />
        </>
    );
};

export default InvoiceManager;
