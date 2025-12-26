import React, { useState, useEffect } from 'react';

// Define the Project interface here as it is used locally or imported from a types file.
// For simplicity in this file, we define it inline or assume passed props structure.
export interface Project {
    id: number;
    name: string;
    type: string;
    amount: number;
    images: string[];
}

interface ProjectCardProps {
    project: Project;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Image Slider Logic
    useEffect(() => {
        if (project.images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [project.images.length]);

    return (
        <article className="card">
            <div className="card-image-container">
                {project.images.length > 0 ? (
                    project.images.map((src, idx) => (
                        <img
                            key={idx}
                            src={src}
                            alt={`Project ${project.name} ${idx}`}
                            className={`card-image ${idx === currentImageIndex ? 'active' : ''}`}
                        />
                    ))
                ) : (
                    <div style={{ width: '100%', height: '160px', background: '#222' }}></div>
                )}

                <div className="card-actions">
                    <button className="btn-icon" onClick={() => onEdit(project.id)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button className="btn-icon" onClick={() => onDelete(project.id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="card-content">
                <div className="card-title">{project.name}</div>
                <div className="card-meta">
                    <span>{project.type}</span>
                    <span className="price-tag">₹{project.amount}</span>
                </div>
            </div>
        </article>
    );
};

export default ProjectCard;
