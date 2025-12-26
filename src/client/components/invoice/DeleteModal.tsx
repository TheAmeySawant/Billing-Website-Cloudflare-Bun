import React from 'react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} id="deleteModal" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal" style={{ borderColor: '#ff4444' }}>
                <h2 style={{ color: '#ff4444' }}>Confirm Delete</h2>
                <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#ff4444', color: '#fff', boxShadow: '0 0 15px rgba(255, 68, 68, 0.4)' }}
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
