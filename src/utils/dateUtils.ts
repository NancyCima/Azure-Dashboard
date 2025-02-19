export function formatDate(dateString: string | undefined): string {
    if (!dateString || dateString.toLowerCase() === "no disponible") return "No disponible";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${date.getFullYear()}`;
}