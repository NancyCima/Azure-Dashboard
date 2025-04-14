import { useState, useEffect } from 'react';
import { Search, User, Loader2, Copy, Check, AlertCircle, Upload, X } from 'lucide-react';
import { useTickets as useWorkitems } from '../contexts/TicketsContext';
import { api, WorkItem } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import Header from '../components/Header';
import { useClickOutside } from '../hooks/useClickOutside';
import { WorkItemLink } from '../components/common/WorkItemLink';

function TicketsAnalysis() {
  const { workitems: contextTickets, loading: contextLoading, error: contextError } = useWorkitems();
  const [tickets, setTickets] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<WorkItem | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    suggestedCriteria: string[];
    imageAnalysis?: string;
    generalSuggestions?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializar el hook useClickOutside
  const { isOpen, setIsOpen, ref } = useClickOutside(false);

  // Cargar análisis guardados al inicio
  useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') ?? '{}');
    const updatedTickets = contextTickets.map(ticket => ({
      ...ticket,
      analysis: savedAnalyses[ticket.id] || null, // Cargar el análisis guardado
    }));
    setTickets(updatedTickets);
    setLoading(contextLoading);
    setError(contextError);
  }, [contextTickets, contextLoading, contextError]);

  // Guardar análisis en localStorage
  const handleSaveAnalysis = async (ticketId: number, analysis: any) => {
    setSaving(true);
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') ?? '{}');
      savedAnalyses[ticketId] = analysis;
      localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));

      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, analysis } : ticket
      );
      setTickets(updatedTickets);

      setModalError(null);
      setTimeout(() => {
        setSaving(false);
      }, 1000);
    } catch (err) {
      setModalError('Error al guardar el análisis');
      setSaving(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(contextTickets)) {
      const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') ?? '{}');
      const updatedTickets = contextTickets.map(ticket => ({
        ...ticket,
        analysis: savedAnalyses[ticket.id] || null, // Cargar el análisis guardado
      }));
      setTickets(updatedTickets);
    } else {
      setTickets([]);
    }
    setLoading(contextLoading);
    setError(contextError);
  }, [contextTickets, contextLoading, contextError]);

  const filteredTickets = tickets.filter(ticket => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(searchTermLower) ||
      ticket.id.toString().includes(searchTerm)
    );
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_IMAGES = 5;
    const MAX_SIZE_MB = 5;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Validaciones
    if (files.length > MAX_IMAGES) {
        setModalError(`Máximo ${MAX_IMAGES} imágenes permitidas`);
        return;
    }

    const validFiles = Array.from(files).filter(file => {
        if (!validTypes.includes(file.type)) return false;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) return false;
        return true;
    });

    if (validFiles.length !== files.length) {
        setModalError('Algunos archivos no son válidos (formatos: JPG, PNG, GIF, WEBP, max 5MB)');
    }

    setSelectedImages(validFiles);
    setModalError(null); // Limpiar errores anteriores
  };

  const handleAnalyze = async () => {
    if (!selectedTicket) return;

    setAnalyzing(true);
    setAiAnalysis(null);
    setModalError(null);

    try {
        // Convertir null/undefined a string vacío
        const description = selectedTicket.description || '';
        const acceptanceCriteria = selectedTicket.acceptance_criteria || '';

        // Validar que el ticket tenga contenido para analizar
        if (!description.trim() && !acceptanceCriteria.trim() && !selectedImages) {
            throw new Error(
                'El ticket debe tener una descripción o criterios de aceptación o una imagen para ser analizado.'
            );
        }

        const analysis = await api.analizeWorkitem(
            {
                ...selectedTicket,
                description, // Asegurar que description no sea null
                acceptance_criteria: acceptanceCriteria // Asegurar que acceptance_criteria no sea null
            },
            selectedImages
        );
        setAiAnalysis(analysis);

        const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') ?? '{}');
        delete savedAnalyses[selectedTicket.id];
        localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));

        const updatedTickets = tickets.map(ticket =>
            ticket.id === selectedTicket.id ? { ...ticket, analysis: null } : ticket
        );
        setTickets(updatedTickets);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al analizar el ticket';
        setModalError(errorMessage);
    } finally {
        setAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!aiAnalysis?.suggestedCriteria) return;

    try {
      await navigator.clipboard.writeText(aiAnalysis.suggestedCriteria.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setModalError('Error al copiar al portapapeles');
    }
  };

  // Función para limpiar estilos no deseados en el HTML
  const cleanHtmlContent = (html: string) => {
    // Remove background-color styles from spans
    if (!html || html === '') return html;
    return html.replace(/style="[^"]*background-color:[^"]*"/g, '');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showBackButton />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-800 mb-8">Análisis de Tickets</h1>

          <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o ID del ticket..."
              className="w-full pl-10 pr-4 py-2 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading && (
            <div className="text-center">
              <p className="text-blue-800">Cargando tickets...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsOpen(true);
                  setAiAnalysis(ticket.analysis || null); // Cargar el análisis guardado
                  setModalError(null);
                  setSelectedImages([]);
                }}
                className="bg-blue-50 p-6 rounded-lg shadow-md cursor-pointer transform transition-transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-gray-900 font-mono">#{ticket.id}</span>
                    <h3 className="text-xl font-semibold text-gray-900 ml-2">{ticket.title}</h3>
                    {ticket.analysis && (
                      <Check className="w-6 h-6 text-green-700" />
                    )}
                    <WorkItemLink url={ticket.work_item_url} />
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  <User className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-blue-600 text-sm">
                    {ticket.assignedTo === "" ? "No disponible" : ticket.assignedTo}
                  </span>
                </div>
                <div
                  className="prose prose-sm max-w-none mb-2 line-clamp-2 [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(ticket.description) }}
                />
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {ticket.state}
                  </span>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {ticket.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {isOpen && selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div ref={ref} className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center mb-2">
                      <span className="text-gray-900 font-mono mr-2">#{selectedTicket.id}</span>
                        <h2 className="text-2xl font-bold text-gray-900 mr-2">{selectedTicket.title}</h2>
                        <WorkItemLink url={selectedTicket.work_item_url} />
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-600">
                          {selectedTicket.assignedTo === "" ? "No disponible" : selectedTicket.assignedTo}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setSelectedTicket(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-700 mb-3">Descripción:</h3>
                    <div
                      className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-lg [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                      dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedTicket.description) }}
                    />
                  </div>

                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-700 mb-3">Criterios de Aceptación Actuales:</h3>
                    <div
                      className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-lg [&>*]:text-gray-600 [&>*]:!font-normal [&_strong]:!text-gray-700 [&_strong]:!font-medium"
                      dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedTicket.acceptance_criteria) }}
                    />
                  </div>

                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-700 mb-3">Cargar Imagen:</h3>
                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none">
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {selectedImages.length > 0 ? 'Imagenes seleccionadas' : 'Seleccionar imagen'}
                        </span>
                      </div>
                      {/* Input de imágenes */}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={analyzing}
                      />
                    </label>
                  </div>

                  {/* Mensajes de error */}
                  {modalError && (
                    <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-red-700">{modalError}</p>
                    </div>
                  )}

                  <div className="flex gap-4 mb-8">
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        'Analizar con IA'
                      )}
                    </button>

                    {aiAnalysis && (
                      <button
                        onClick={() => handleSaveAnalysis(selectedTicket.id, aiAnalysis)}
                        disabled={saving || analyzing} // Deshabilitar si saving o analyzing es true
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Análisis'
                        )}
                      </button>
                    )}
                  </div>

                  {aiAnalysis && (
                    <div className="mb-8">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-700">Criterios de Aceptación Sugeridos:</h3>
                          <button
                            onClick={handleCopy}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {copied ? (
                              <Check className="w-5 h-5 mr-1" />
                            ) : (
                              <Copy className="w-5 h-5 mr-1" />
                            )}
                            {copied ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 bg-gray-50 p-4 rounded-lg">
                          {aiAnalysis.suggestedCriteria.map((criteria, index) => (
                            <li 
                              key={index} 
                              className="text-gray-600"
                              dangerouslySetInnerHTML={{
                                __html: criteria
                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                              }}
                            />
                          ))}
                        </ul>
                      </div>

                      {aiAnalysis.generalSuggestions && aiAnalysis.generalSuggestions.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Sugerencias Generales:</h3>
                          <ul className="list-disc pl-5 space-y-2 bg-gray-50 p-4 rounded-lg">
                            {aiAnalysis.generalSuggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="text-gray-600"
                                dangerouslySetInnerHTML={{
                                  __html: suggestion
                                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                }}
                              />
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.imageAnalysis && (
                        <div className="mt-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Análisis de Imagen:</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600">{aiAnalysis.imageAnalysis}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Estado: {selectedTicket.state}
                    </span>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Tipo: {selectedTicket.type}
                    </span>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Última modificación: {formatDate(selectedTicket.changedDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketsAnalysis;