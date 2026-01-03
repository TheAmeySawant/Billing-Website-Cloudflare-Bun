
import { useState, useEffect } from 'react';
import EditClientModal from './EditClientModal';
import ClientSection from './ClientSection';

interface Invoice {
    id: number;
    internalId?: string;
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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clientData, setClientData] = useState<ClientData>({
        name: "Loading...",
        description: ""
    });

    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<number | null>(null);

    // Loading States
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
    const [isUpdatingClient, setIsUpdatingClient] = useState(false);

    // New Invoice Form State
    const [selectedMonth, setSelectedMonth] = useState('October');
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [years, setYears] = useState<number[]>([]);

    const fetchClientData = async (clientId: string) => {
        setIsLoadingInvoices(true);
        try {
            const response = await fetch(`/api/client-invoices/${clientId}`);
            if (response.ok) {
                const { data } = await response.json();

                // Map Client Data
                setClientData({
                    name: data.client.name,
                    description: data.client.description || ""
                });

                // Map Invoices
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

                const mappedInvoices = data.invoices.map((inv: any, index: number) => {
                    // Parse YYYYMM
                    let monthName = inv.month;
                    let yearStr = "2025"; // Fallback

                    if (inv.month && inv.month.length === 6) {
                        const y = inv.month.substring(0, 4);
                        const m = parseInt(inv.month.substring(4, 6), 10); // 1-12
                        yearStr = y;
                        if (m >= 1 && m <= 12) {
                            monthName = monthNames[m - 1];
                        }
                    }

                    return {
                        id: index,
                        internalId: inv.month,
                        month: monthName,
                        year: yearStr,
                        status: inv.status,
                        totalAmount: inv.totalAmount
                    };
                });
                setInvoices(mappedInvoices);

            } else {
                console.error("Failed to fetch client data");
                setClientData(prev => ({ ...prev, name: "Client Not Found" }));
            }
        } catch (error) {
            console.error("Error fetching client data:", error);
        } finally {
            setIsLoadingInvoices(false);
        }
    };

    const fetchInvoices = async (clientId: string) => {
        setIsLoadingInvoices(true);
        try {
            const response = await fetch(`/api/client-invoices/${clientId}/list`);
            if (response.ok) {
                const { data } = await response.json();

                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

                const mappedInvoices = data.map((inv: any, index: number) => {
                    let monthName = inv.month;
                    let yearStr = "2025";

                    if (inv.month && inv.month.length === 6) {
                        const y = inv.month.substring(0, 4);
                        const m = parseInt(inv.month.substring(4, 6), 10);
                        yearStr = y;
                        if (m >= 1 && m <= 12) {
                            monthName = monthNames[m - 1];
                        }
                    }

                    return {
                        id: index,
                        internalId: inv.month,
                        month: monthName,
                        year: yearStr,
                        status: inv.status,
                        totalAmount: inv.totalAmount
                    };
                });
                setInvoices(mappedInvoices);
            } else {
                console.error("Failed to fetch invoices");
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setIsLoadingInvoices(false);
        }
    };

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

        // Fetch Data based on URL param
        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('clientId');
        if (clientId) {
            fetchClientData(clientId);
        }
    }, []);

    // Statistics derived from state
    // Note: create/delete operations update 'invoices' state, so stats update automatically.
    const totalInvoices = invoices.length;
    const totalEarnings = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

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

    const handleSaveInvoice = async () => {
        // Check for duplicate (Client-side)
        const exists = invoices.some(inv => inv.month === selectedMonth && inv.year === selectedYear);
        if (exists) {
            setIsDuplicateModalOpen(true);
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('clientId');
        if (!clientId) {
            console.error("Client ID not found");
            return;
        }

        setIsCreatingInvoice(true);
        try {
            const response = await fetch('/api/new/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: clientId,
                    month: selectedMonth,
                    year: selectedYear,
                    status: selectedStatus
                })
            });

            if (response.ok) {
                setIsNewModalOpen(false);
                fetchInvoices(clientId);
            } else if (response.status === 409) {
                setIsDuplicateModalOpen(true);
            } else {
                const res = await response.json();
                console.error("Failed to create invoice", res.error);
                alert("Failed to create invoice: " + res.error);
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            alert("Error creating invoice");
        } finally {
            setIsCreatingInvoice(false);
        }
    };

    const confirmDelete = (id: number) => {
        setInvoiceToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        const invoice = invoices.find(inv => inv.id === invoiceToDeleteId);

        if (invoice) {
            const params = new URLSearchParams(window.location.search);
            const clientId = params.get('clientId');

            if (clientId && invoice.internalId) {
                setIsDeletingInvoice(true);
                try {
                    const response = await fetch(`/api/invoice?clientId=${clientId}&invoiceMonth=${invoice.internalId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        fetchInvoices(clientId);
                        setIsDeleteModalOpen(false);
                        setInvoiceToDeleteId(null);
                    } else {
                        const res = await response.json();
                        alert("Failed to delete invoice: " + (res.error || "Unknown error"));
                    }
                } catch (error) {
                    console.error("Error deleting invoice:", error);
                    alert("Error deleting invoice");
                } finally {
                    setIsDeletingInvoice(false);
                }
            }
        }
    };

    const handleSaveClientData = async (newData: ClientData) => {
        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('clientId');

        if (!clientId) {
            console.error("Client ID not found");
            return;
        }

        setIsUpdatingClient(true);
        try {
            const response = await fetch(`/api/client/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newData)
            });

            if (response.ok) {
                setClientData(newData);
                setIsEditClientModalOpen(false);
            } else {
                const res = await response.json();
                alert("Failed to update client: " + (res.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error updating client:", error);
            alert("Error updating client");
        } finally {
            setIsUpdatingClient(false);
        }
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
                isLoading={isUpdatingClient}
            />

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', color: '#fff' }}>
                Monthly Invoices
            </h2>

            <div className="controls">
                <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>New Monthly Invoice</button>
            </div>

            <div className="invoice-grid">
                {sortedInvoices.length > 0 ? (
                    sortedInvoices.map(invoice => (
                        <a key={invoice.id} className="invoice-card" style={{ textDecoration: 'none' }} href={`/invoice?clientId=${new URLSearchParams(window.location.search).get('clientId')}&month=${invoice.internalId}`}>
                            <div>
                                <div className="card-date">{invoice.month}</div>
                                <div className="card-year">{invoice.year}</div>
                                <div style={{ color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                    ₹{invoice.totalAmount || 0}
                                </div>
                            </div>
                            <div className="card-footer">
                                <span className={`status-badge ${invoice.status.toLowerCase() === 'paid' ? 'status-paid' : 'status-pending'}`} style={{ textTransform: 'capitalize' }}>
                                    {invoice.status}
                                </span>
                                <button className="btn-delete" onClick={(e) => {
                                    e.preventDefault();
                                    confirmDelete(invoice.id);
                                }}>Delete</button>
                            </div>
                        </a>
                    ))
                ) : (
                    isLoadingInvoices ? (
                        <div style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3rem',
                            color: '#fff'
                        }}>
                            <div className="spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                borderTopColor: 'var(--accent)',
                                animation: 'spin 1s ease-in-out infinite'
                            }}></div>
                            <p style={{ marginTop: '1rem', color: '#888' }}>Loading Invoices...</p>
                        </div>
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3rem',
                            borderRadius: '25%'
                        }}>
                            <img
                                className="empty-box"
                                src="/assets/empty-box.png"
                                alt="No invoices found"
                                style={{ maxWidth: '300px', width: '100%', objectFit: 'contain' }}
                            />
                            {/* <p style={{ marginTop: '1rem', color: '#888' }}>No invoices found for this client.</p> */}
                        </div>
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
                        <button className="btn-secondary" onClick={() => setIsNewModalOpen(false)} disabled={isCreatingInvoice}>Cancel</button>
                        <button className="btn-primary" onClick={handleSaveInvoice} disabled={isCreatingInvoice}>
                            {isCreatingInvoice ? (
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
                            ) : "Save"}
                        </button>
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
                        <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingInvoice}>Cancel</button>
                        <button className="btn-primary" style={{ background: '#ff4444', borderColor: '#ff4444', color: '#fff' }} onClick={executeDelete} disabled={isDeletingInvoice}>
                            {isDeletingInvoice ? (
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
                                    Deleting...
                                </span>
                            ) : "Delete"}
                        </button>
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
