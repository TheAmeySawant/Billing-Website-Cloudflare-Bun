interface ClientCardProps {
    image: string;
    title: string;
    description: string;
    code: string;
}

export default function ClientCard({ image, title, description, code }: ClientCardProps) {
    return (
        <a href="/clientInvoices" className="card block bg-white/5 border border-[#333] rounded-lg overflow-hidden transition-all duration-300 relative group hover:-translate-y-1 hover:border-[#ccff00] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <article className="flex flex-col h-full">
                <img src={image} alt={title} className="w-full h-[180px] object-cover border-b border-[#333] bg-[#222]" />
                <div className="p-6 flex-grow flex flex-col">
                    <div className="font-['Syne'] text-[1.2rem] text-white mb-2">{title}</div>
                    <div className="text-[0.9rem] text-[#aaa] mb-4 leading-[1.4]">{description}</div>
                    <div className="flex justify-between items-center border-t border-dashed border-[#333] pt-4 text-[0.85rem] text-[#ccff00] font-bold mt-auto">
                        <span>{code}</span>
                    </div>
                </div>
            </article>
        </a>
    );
}
