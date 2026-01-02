interface ClientCardProps {
    id: number;
    image: string;
    title: string;
    description: string;
    code: string;
}

export default function ClientCard({ id, image, title, description, code }: ClientCardProps) {
    return (
        <a href={`/clientInvoices?clientId=${id}`} className="client-card">
            <article className="client-card-inner">
                <img src={image} alt={title} className="client-card-image" />
                <div className="client-card-content">
                    <div className="client-card-title">{title}</div>
                    <div className="client-card-desc">{description}</div>
                    <div className="client-card-footer">
                        <span>{code}</span>
                    </div>
                </div>
            </article>
        </a>
    );
}
