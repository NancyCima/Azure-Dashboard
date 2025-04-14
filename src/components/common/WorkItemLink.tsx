import { ExternalLink } from 'lucide-react';

/**
 * Componente para mostrar un enlace al Work Item.
 * @param url - La URL del Work Item.
 * @returns Un enlace que abre el Work Item en una nueva pestaña.
 */
export const WorkItemLink = ({ url }: { url: string }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:text-blue-800"
        onClick={(e) => {
            e.stopPropagation(); // Evita que el evento se propague
            window.open(url, '_blank'); // Abre el enlace en una nueva pestaña
        }}
    >
        <ExternalLink className="w-4 h-4 ml-2" />
    </a>
);