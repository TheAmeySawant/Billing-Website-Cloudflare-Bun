import React from 'react';
import ProjectCard, { type Project } from './ProjectCard';

interface ProjectsGridProps {
    projects: Project[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, onEdit, onDelete }) => {
    return (
        <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>Work Delivered</h2>
            <div className="projects-grid" id="projectsGrid">
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </>
    );
};

export default ProjectsGrid;
