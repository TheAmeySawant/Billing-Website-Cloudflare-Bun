import React from 'react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectId: number | null;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, projectId }) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!projectId) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/delete/project", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: projectId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete project");
            }

            if (data.warning) {
                console.warn("Delete warning:", data.warning);
            }

            onConfirm(); // Updates parent state (removes from list)
            onClose();

        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Error deleting project: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} id="deleteModal" onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) onClose();
        }}>
            <div className="modal" style={{ borderColor: '#ff4444' }}>
                <h2 style={{ color: '#ff4444' }}>Confirm Delete</h2>
                <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isDeleting}>Cancel</button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                            background: '#ff4444',
                            color: '#fff',
                            boxShadow: '0 0 15px rgba(255, 68, 68, 0.4)',
                            opacity: isDeleting ? 0.7 : 1,
                            cursor: isDeleting ? 'wait' : 'pointer'
                        }}
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
