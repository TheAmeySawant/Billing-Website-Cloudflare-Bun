
import { useState, useEffect } from 'react';
import EditClientModal from './EditClientModal';
import ClientSection from './ClientSection';

interface Invoice {
    id: number;
    month: string;
    year: string;
    status: string;
    totalAmount: number;
}

interface ClientData {
    name: string;
    description: string;
}

export default function InvoiceManager() {
    const [invoices, setInvoices] = useState<Invoice[]>([
        { id: 1, month: 'November', year: '2025', status: 'Pending', totalAmount: 400 },
        { id: 2, month: 'October', year: '2025', status: 'Paid', totalAmount: 350 },
        { id: 3, month: 'September', year: '2025', status: 'Paid', totalAmount: 300 }
    ]);

    const [clientData, setClientData] = useState<ClientData>({
        name: "Dark Winter",
        description: "Music Production and Bundle"
    });

    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<number | null>(null);

    // New Invoice Form State
    const [selectedMonth, setSelectedMonth] = useState('October'); // Default to current or static
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [years, setYears] = useState<number[]>([]);

    useEffect(() => {
        // Set default month/year on mount
        const now = new Date();
        setSelectedMonth(now.toLocaleString('default', { month: 'long' }));
        setSelectedYear(now.getFullYear().toString());

        // Generate years
        const currentYear = now.getFullYear();
        const yearList = [];
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            yearList.push(i);
        }
        setYears(yearList);
    }, []);

    const totalInvoices = invoices.length;
    const totalEarnings = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const sortInvoices = (list: Invoice[]) => {
        const monthMap: { [key: string]: number } = {
            "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
            "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
        };
        return [...list].sort((a, b) => {
            const yearDiff = parseInt(b.year) - parseInt(a.year);
            if (yearDiff !== 0) return yearDiff;
            return monthMap[b.month] - monthMap[a.month];
        });
    };

    const sortedInvoices = sortInvoices(invoices);

    const handleSaveInvoice = () => {
        // Check for duplicate
        const exists = invoices.some(inv => inv.month === selectedMonth && inv.year === selectedYear);
        if (exists) {
            setIsDuplicateModalOpen(true);
            return;
        }

        const newInvoice: Invoice = {
            id: Date.now(),
            month: selectedMonth,
            year: selectedYear,
            status: selectedStatus,
            totalAmount: 0 // Default
        };

        setInvoices([...invoices, newInvoice]);
        setIsNewModalOpen(false);
    };

    const confirmDelete = (id: number) => {
        setInvoiceToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        if (invoiceToDeleteId !== null) {
            setInvoices(invoices.filter(inv => inv.id !== invoiceToDeleteId));
            setIsDeleteModalOpen(false);
            setInvoiceToDeleteId(null);
        }
    };

    const handleSaveClientData = (newData: ClientData) => {
        setClientData(newData);
    };

    return (
        // Fragment is usually enough but we need to fit in the container slot
        <>
            <header>
                <div className="brand">
                    <h1>dzynsby<br />soham</h1>
                    <span>ADMIN PANEL</span>
                </div>
            </header>

            {/* <header className="dashboard-header">
                <div className="brand">
                    <h1 className="brand-title">
                        dzynsby<br />soham
                    </h1>
                    <span className="brand-subtitle">
                        ADMIN PANEL
                    </span>
                </div>
            </header> */}

            <ClientSection
                totalInvoices={totalInvoices}
                totalEarnings={totalEarnings}
                clientData={clientData}
                onEdit={() => setIsEditClientModalOpen(true)}
            />

            <EditClientModal
                isOpen={isEditClientModalOpen}
                onClose={() => setIsEditClientModalOpen(false)}
                onSave={handleSaveClientData}
                initialData={clientData}
            />

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', color: '#fff' }}>
                Monthly Invoices
            </h2>

            <div className="controls">
                <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>New Monthly Invoice</button>
            </div>

            <div className="invoice-grid">
                {sortedInvoices.map(invoice => (
                    <a key={invoice.id} className="invoice-card" style={{textDecoration: 'none'}} href='/invoice'>
                        <div>
                            <div className="card-date">{invoice.month}</div>
                            <div className="card-year">{invoice.year}</div>
                            <div style={{ color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                ₹{invoice.totalAmount || 0}
                            </div>
                        </div>
                        <div className="card-footer">
                            <span className={`status-badge ${invoice.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                                {invoice.status}
                            </span>
                            <button className="btn-delete" onClick={() => confirmDelete(invoice.id)}>Delete</button>
                        </div>
                    </a>
                ))}
            </div>

            <footer>
                <p style={{ textAlign: 'center', color: '#555', marginTop: '3rem', fontSize: '0.8rem' }}>
                    &copy; 2025 dzynsbysoham.
                </p>
            </footer>

            {/* NEW INVOICE MODAL */}
            <div className={`modal-backdrop ${isNewModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsNewModalOpen(false); }}>
                <div className="modal-content">
                    <h3 className="modal-title">New Invoice</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Month</label>
                            <select className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                                    .map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Year</label>
                            <select className="form-control" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setIsNewModalOpen(false)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSaveInvoice}>Save</button>
                    </div>
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <div className={`modal-backdrop ${isDeleteModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}>
                <div className="modal-content">
                    <h3 className="modal-title">Confirm Delete</h3>
                    <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        Are you sure you want to delete this invoice? This action cannot be undone.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        <button className="btn-primary" style={{ background: '#ff4444', borderColor: '#ff4444', color: '#fff' }} onClick={executeDelete}>Delete</button>
                    </div>
                </div>
            </div>

            {/* DUPLICATE WARNING MODAL */}
            <div className={`modal-backdrop ${isDuplicateModalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsDuplicateModalOpen(false); }}>
                <div className="modal-content">
                    <h3 className="modal-title" style={{ color: '#ff4444' }}>Duplicate Invoice</h3>
                    <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        An invoice for {selectedMonth} {selectedYear} already exists.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setIsDuplicateModalOpen(false)}>OK</button>
                    </div>
                </div>
            </div>
        </>
    );
}
