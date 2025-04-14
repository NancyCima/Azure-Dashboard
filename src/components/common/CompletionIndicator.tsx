import { Check, X } from 'lucide-react';

/**
 * Componente para mostrar un indicador de completitud.
 * @param isComplete - Indica si el elemento está completo o no.
 * @returns Un ícono de "check" (verde) si está completo, o una "X" (roja) si está incompleto.
 */
export const CompletionIndicator = ({ isComplete }: { isComplete: boolean }) => {
    return isComplete ? (
        <Check className="w-6 h-6 text-green-600" />
    ) : (
        <X className="w-6 h-6 text-red-600" />
    );
};