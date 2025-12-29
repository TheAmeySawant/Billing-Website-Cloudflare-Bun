import { useState } from 'react';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert("Name is required");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/new/client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    code,
                    description
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Reset form and close
                setName("");
                setCode("");
                setDescription("");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(data.error || "Failed to create client");
            }
        } catch (error) {
            console.error("Error creating client:", error);
            alert("An error occurred while creating the client");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={handleBackdropClick} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
        }}>
            <style>{`
                .modal-content {
                    background: var(--bg);
                    border: 2px solid var(--accent);
                    width: 100%;
                    max-width: 500px;
                    padding: 2rem;
                    position: relative;
                    box-shadow: 0 0 50px var(--accent-glow);
                }
                .modal-header {
                    font-family: var(--font-display);
                    font-size: 1.5rem;
                    color: #fff;
                    margin-bottom: 1.5rem;
                    text-transform: uppercase;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    color: #888;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                input[type="text"], textarea {
                    width: 100%;
                    padding: 1rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    color: #fff;
                    font-family: var(--font-main);
                    outline: none;
                }
                textarea {
                    resize: vertical;
                    min-height: 100px;
                }
                input[type="text"]:focus, textarea:focus {
                    border-color: var(--accent);
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                button {
                    padding: 1rem 2rem;
                    background: var(--surface);
                    border: 1px solid var(--accent);
                    color: var(--accent);
                    font-family: var(--font-main);
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 1px;
                    transition: all 0.3s;
                    white-space: nowrap;
                    cursor: none;
                }
                button:hover {
                    background: var(--accent);
                    color: #000;
                }
                .btn-primary {
                    background: var(--accent);
                    color: #000;
                }
                .btn-primary:hover {
                    background: #fff;
                    border-color: #fff;
                }
                .client-code{
                    display: flex;
                    width: 100%;
                    padding: 1rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    color: #fff;
                    font-family: var(--font-main);
                    outline: none;
                }
                
                .client-code input{
                    width: 100%;
                    padding: 0px;
                    background: var(--surface);
                    border: none;
                    color: #fff;
                    font-family: var(--font-main);
                    outline: none;
                }
                .client-code div{
                    display: flex;
                    align-items: center;
                    color: var(--accent);
                    font-family: var(--font-main);
                    font-weight: 400;
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
            <div className="modal-content">
                <h3 className="modal-header">Add New Client</h3>

                <div className="form-group">
                    <label>Client Name</label>
                    <input
                        name='name'
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Client Code</label>
                    <div className='client-code'>
                        <div className='hash'>#</div>
                        <input
                            name='code'
                            type="text"
                            placeholder="e.g. AC001"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                        name='description'
                        placeholder="Brief details about the client..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Client"}
                    </button>
                </div>
            </div>
        </div>
    );
}
