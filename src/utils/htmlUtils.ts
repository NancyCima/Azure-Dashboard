export function cleanHtmlContent(html: string): string {
    /*
    Limpia el contenido HTML manteniendo la estructura pero removiendo estilos y atributos innecesarios.
    Si el contenido es vacío o irrelevante, devuelve una cadena vacía.
    */
    if (!html || html.trim() === '' || html.toLowerCase() === 'no disponible') {
        return '';
    }

    try {
        // Crear un elemento temporal
        const div = document.createElement('div');
        div.innerHTML = html;

        // Remover todos los atributos excepto 'href' en enlaces
        const elements = div.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const attributes = element.attributes;
            for (let j = attributes.length - 1; j >= 0; j--) {
                const attr = attributes[j];
                if (!(element.tagName.toLowerCase() === 'a' && attr.name === 'href')) {
                    element.removeAttribute(attr.name);
                }
            }
        }

        // Convertir <br> en saltos de línea
        const brs = div.getElementsByTagName('br');
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].parentNode?.replaceChild(document.createTextNode('\n'), brs[i]);
        }

        // Convertir <div> en <p>
        const divs = div.getElementsByTagName('div');
        for (let i = divs.length - 1; i >= 0; i--) {
            const p = document.createElement('p');
            p.innerHTML = divs[i].innerHTML;
            divs[i].parentNode?.replaceChild(p, divs[i]);
        }

        // Obtener el texto limpio
        let text = div.textContent || div.innerText || '';

        // Remover líneas vacías múltiples
        text = text.replace(/\n\s*\n/g, '\n');
        
        // Remover espacios en blanco al inicio y final
        text = text.trim();

        return text;
    } catch (error) {
        console.error('Error cleaning HTML:', error);
        return html.replace(/<[^>]*>/g, '').trim();
    }
}
