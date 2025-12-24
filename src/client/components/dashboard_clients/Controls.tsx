interface ControlsProps {
    onSearch: (query: string) => void;
    onNewClient: () => void;
}

export default function Controls({ onSearch, onNewClient }: ControlsProps) {
    return (
        <section className="controls-section" style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            <style>{`
                .search-container {
                    flex-grow: 1;
                    display: flex;
                    gap: 0.5rem;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 1rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    color: #fff;
                    font-family: var(--font-main);
                    outline: none;
                    transition: border-color 0.3s;
                }
                input[type="text"]:focus {
                    border-color: var(--accent);
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
                @media (max-width: 768px) {
                    .controls-section {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .search-container {
                        flex-direction: column;
                    }
                    .btn-primary {
                        width: 100%;
                        text-align: center;
                    }
                }
            `}</style>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search clients..."
                    onChange={(e) => onSearch(e.target.value)}
                />
                <button>Search</button>
            </div>
            <button className="btn-primary" onClick={onNewClient}>+ New Client</button>
        </section>
    );
}
