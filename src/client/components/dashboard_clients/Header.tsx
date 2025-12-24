export default function Header() {
    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '2px solid var(--accent)',
            paddingBottom: '2rem',
            marginBottom: '3rem',
            flexDirection: 'row', // Default desktop
            // Responsive styles handled via CSS classes or media queries in global css, 
            // but for inline react styles, we might need a wrapper or just rely on the global CSS.
            // Since we have global CSS for 'header', we can just use the tag/classes.
        }} className="dashboard-header">
           <style>{`
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-bottom: 2px solid var(--accent);
                    padding-bottom: 2rem;
                    margin-bottom: 3rem;
                }
                .brand h1 {
                    font-family: var(--font-display);
                    font-size: clamp(2rem, 4vw, 3rem);
                    text-transform: uppercase;
                    line-height: 0.9;
                    color: var(--accent);
                    margin: 0;
                }
                .brand span {
                    display: block;
                    font-size: 0.9rem;
                    color: #fff;
                    letter-spacing: 2px;
                    margin-top: 0.5rem;
                }
                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                }
            `}</style>
            <div className="brand">
                <h1>dzynsby<br/>soham</h1>
                <span>CLIENT DASHBOARD</span>
            </div>
        </header>
    );
}
