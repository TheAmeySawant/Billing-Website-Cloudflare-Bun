import { useState } from 'react';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
    const [fileName, setFileName] = useState("Click to Upload Image");

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        } else {
            setFileName("Click to Upload Image");
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
                .file-upload-box {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    padding: 2rem;
                    background: var(--surface);
                    border: 1px dashed var(--accent);
                    color: #888;
                    cursor: none;
                    transition: all 0.3s;
                    text-align: center;
                }
                .file-upload-box:hover {
                    background: rgba(204, 255, 0, 0.05);
                    color: #fff;
                    border-style: solid;
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
            `}</style>
            <div className="modal-content">
                <h3 className="modal-header">Add New Client</h3>

                <div className="form-group">
                    <label>Client Name</label>
                    <input type="text" placeholder="e.g. Acme Corp" />
                </div>

                <div className="form-group">
                    <label>Client Code</label>
                    <div className='client-code'><div>#</div> <input type="text" placeholder="e.g. #AC001" /></div>
                </div>

                {/* <div className="form-group">
                    <label>Client Image</label>
                    <input type="file" id="clientImage" accept="image/*" hidden onChange={handleFileChange} />
                    <label htmlFor="clientImage" className="file-upload-box">
                        <span style={{ color: fileName !== "Click to Upload Image" ? 'var(--accent)' : 'inherit' }}>
                            {fileName}
                        </span>
                    </label>
                </div> */}

                <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea placeholder="Brief details about the client..."></textarea>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={onClose}>Save Client</button>
                </div>
            </div>
        </div>
    );
}
