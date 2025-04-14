import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar clics fuera de un elemento.
 * @param initialState - Estado inicial del recuadro (abierto o cerrado).
 * @returns Un objeto con el estado `isOpen`, la función `setIsOpen` y la referencia `ref`.
 */
export function useClickOutside(initialState: boolean) {
    const [isOpen, setIsOpen] = useState(initialState);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        // Agrega el event listener solo si el modal está abierto
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Limpia el event listener cuando el componente se desmonta o cuando isOpen cambia
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return { isOpen, setIsOpen, ref };
}