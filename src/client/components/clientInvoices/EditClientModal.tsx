
import { useState, useEffect } from 'react';

interface ClientData {
    name: string;
    description: string;
}

interface EditClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ClientData) => void;
    initialData: ClientData;
    isLoading?: boolean;
}

export default function EditClientModal({ isOpen, onClose, onSave, initialData, isLoading = false }: EditClientModalProps) {
    const [name, setName] = useState(initialData.name);
    const [description, setDescription] = useState(initialData.description);

    // Reset state when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setName(initialData.name);
            setDescription(initialData.description);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSave = () => {
        onSave({ name, description });
        onClose();
    };

    return (
        <div
            className={`modal-backdrop ${isOpen ? 'active' : ''}`}
            onClick={handleBackdropClick}
        >
            <div className="modal-content">
                <h3 className="modal-title">Edit Client</h3>

                <div className="form-group">
                    <label>Client Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-control"
                        style={{ minHeight: '100px', resize: 'vertical' }}
                    ></textarea>
                </div>

                <div className="modal-actions">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="spinner" style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%',
                                    borderTopColor: '#fff',
                                    animation: 'spin 1s ease-in-out infinite',
                                    display: 'inline-block'
                                }}></span>
                                Saving...
                            </span>
                        ) : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
