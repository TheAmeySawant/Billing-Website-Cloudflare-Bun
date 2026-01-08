import React, { useState, useEffect, useRef } from 'react';
import type { Project } from './ProjectCard';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Omit<Project, 'id'> | Project) => void;
    initialData?: Project | null;
    clientId?: string | null;
    invoiceId?: string | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData, clientId, invoiceId }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Banner');
    const [amount, setAmount] = useState<string>('');
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isDirty, setIsDirty] = useState(false);

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
                setType(initialData.type); // Ensure this matches one of the options or handle mapping
                setAmount(initialData.amount.toString());
                setImages([...initialData.images]);
                setIsDirty(false);
            } else {
                setName('');
                setType('Banner');
                setAmount('');
                setImages([]);
                setIsDirty(false);
            }
        }
    }, [isOpen, initialData]);

    // Dirty Checking Effect
    useEffect(() => {
        if (!initialData) {
            setIsDirty(true); // Always dirty if new? Or only if fields filled? Usually for new, we validate required. For edit, we check diff.
            return;
        }

        const isNameChanged = name !== initialData.name;
        const isTypeChanged = type !== initialData.type;
        const isAmountChanged = Number(amount) !== initialData.amount;

        // Deep compare images
        const isImagesChanged = images.length !== initialData.images.length ||
            !images.every((img, i) => img === initialData.images[i]);

        setIsDirty(isNameChanged || isTypeChanged || isAmountChanged || isImagesChanged);

    }, [name, type, amount, images, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const projectData = {
            ...(initialData ? { id: initialData.id } : {}),
            name,
            type,
            amount: Number(amount),
            images
        };

        // If Editing
        if (initialData) {
            if (!isDirty) return; // Should be disabled anyway

            setIsSubmitting(true);
            try {
                // Construct updates payload with full image state for atomic replacement
                const updates = {
                    name: name !== initialData.name ? name : undefined,
                    type: type !== initialData.type ? type : undefined,
                    amount: Number(amount) !== initialData.amount ? Number(amount) : undefined,
                    images: images // Always send full image list for atomic replacement logic
                };

                const res = await fetch("/api/update/project", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: initialData.id,
                        clientId,
                        invoiceId,
                        updates
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.details || data.error || "Failed to update project");
                }

                // Success
                onSubmit(projectData as Project); // Optimistic / Local update
                onClose();

            } catch (error: any) {
                console.error("Project update error:", error);
                alert("Error updating project: " + error.message);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // If Creating New Project, call API
        if (!clientId || !invoiceId) {
            alert("Missing Client ID or Invoice ID. Cannot create project.");
            return;
        }

        // 100MB Limit Check
        // Estimate size: JSON string length. 
        // Note: 100MB = 100 * 1024 * 1024 bytes.
        // JS strings are UTF-16, but network payload is UTF-8 usually. 
        // Base64 chars are 1 byte in UTF-8.
        // Safe limit: 90MB.
        const payload = {
            clientId,
            invoiceId,
            ...projectData
        };
        const payloadString = JSON.stringify(payload);
        const sizeInBytes = new TextEncoder().encode(payloadString).length; // Accurate byte size
        const limitInBytes = 90 * 1024 * 1024; // 90MB

        if (sizeInBytes > limitInBytes) {
            alert(`Total size (${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the 100MB limit. Please upload fewer or smaller images.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/new/project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payloadString
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to create project");
                throw new Error(errorMessage);
            }

            // Success
            // Call onSubmit with the new ID from server
            onSubmit({ ...projectData, id: data.projectId } as Project);
            onClose();

        } catch (error: any) {
            console.error("Project creation error:", error);
            alert("Error creating project: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
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
    const options = ['Banner', 'Thumbnail', 'Poster'];

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
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || (!!initialData && !isDirty)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isSubmitting && <span className="spinner-small"></span>}
                            {isSubmitting ? (initialData ? 'Updating...' : 'Saving...') : (initialData ? 'Save Changes' : 'Add Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
