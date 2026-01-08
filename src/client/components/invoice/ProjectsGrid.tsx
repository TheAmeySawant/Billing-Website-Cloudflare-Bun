import React from 'react';
import ProjectCard, { type Project } from './ProjectCard';

interface ProjectsGridProps {
    projects: Project[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    isLoading?: boolean;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, onEdit, onDelete, isLoading }) => {
    return (
        <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>Work Delivered</h2>
            <div className="projects-grid" id="projectsGrid">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card" style={{ pointerEvents: 'none' }}>
                            <div className="card-image-container skeleton" style={{ height: '160px', width: '100%' }}></div>
                            <div className="card-content">
                                <div className="card-title skeleton skeleton-text" style={{ width: '80%' }}></div>
                                <div className="card-title skeleton skeleton-text" style={{ width: '50%' }}></div>
                                <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', borderTop: 'none' }}>
                                    <div className="skeleton" style={{ width: '40%', height: '1em' }}></div>
                                    <div className="skeleton" style={{ width: '30%', height: '1em' }}></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </>
    );
};

export default ProjectsGrid;
