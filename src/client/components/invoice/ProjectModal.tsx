import React, { useState, useEffect, useRef } from 'react';
import type { Project } from './ProjectCard';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Omit<Project, 'id'> | Project) => void;
    initialData?: Project | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Banner Design');
    const [amount, setAmount] = useState<string>('');
    const [images, setImages] = useState<string[]>([]);

    // Custom Select State
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Drag & Drop State
    const [dragOver, setDragOver] = useState(false);
    const dragItem = useRef<number | null>(null);

    // Reset or Load Data
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setType(initialData.type);
                setAmount(initialData.amount.toString());
                setImages([...initialData.images]);
            } else {
                setName('');
                setType('Banner Design');
                setAmount('');
                setImages([]);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const projectData = {
            ...(initialData ? { id: initialData.id } : {}),
            name,
            type,
            amount: Number(amount),
            images
        };
        onSubmit(projectData as Project);
        onClose();
    };

    // --- File Handling ---
    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImages(prev => [...prev, e.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    // --- Image Reordering ---
    const handleSortStart = (index: number) => {
        dragItem.current = index;
    };

    const handleSortEnter = (index: number) => {
        if (dragItem.current === null || dragItem.current === index) return;

        const newImages = [...images];
        const draggedItemContent = newImages[dragItem.current];
        newImages.splice(dragItem.current, 1);
        newImages.splice(index, 0, draggedItemContent);

        dragItem.current = index;
        setImages(newImages);
    };

    const handleSortEnd = () => {
        dragItem.current = null;
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // --- Rendering ---
    const options = ['Banner Design', 'Thumbnail', 'Poster', 'Other'];

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal">
                <h2>{initialData ? 'Edit Project' : 'Add New Project'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Name</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            placeholder="e.g. Winter Sale Banner"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Type</label>
                        <div className="custom-select-wrapper" ref={selectRef}>
                            <div className={`custom-select ${isSelectOpen ? 'open' : ''}`}>
                                <div
                                    className="custom-select-trigger"
                                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                                >
                                    {type}
                                </div>
                                <div className="custom-options">
                                    {options.map(opt => (
                                        <span
                                            key={opt}
                                            className={`custom-option ${type === opt ? 'selected' : ''}`}
                                            onClick={() => {
                                                setType(opt);
                                                setIsSelectOpen(false);
                                            }}
                                        >
                                            {opt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            className="form-control"
                            required
                            placeholder="400"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Images</label>
                        {/* Image Manager */}
                        <div className="image-manager">
                            {images.map((src, idx) => (
                                <div
                                    key={idx}
                                    className="img-thumb-wrapper"
                                    draggable
                                    onDragStart={() => handleSortStart(idx)}
                                    onDragEnter={() => handleSortEnter(idx)}
                                    onDragEnd={handleSortEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <img src={src} className="img-thumb" alt="thumb" />
                                    <button
                                        type="button"
                                        className="btn-img-delete"
                                        onClick={() => removeImage(idx)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        <input
                            type="file"
                            id="pImages"
                            multiple
                            accept="image/*"
                            hidden
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                        <label
                            htmlFor="pImages"
                            className={`file-upload-box ${dragOver ? 'dragover' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                        >
                            <span>{images.length > 0 ? `+ Add More Images (${images.length} present)` : '+ Add / Drag Images Here'}</span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{initialData ? 'Save Changes' : 'Add Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
