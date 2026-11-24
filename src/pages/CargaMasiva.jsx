import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  X,
  Plus,
  ArrowRight,
  Layers,
  Coins,
  Receipt,
  FileCheck,
  Check
} from 'lucide-react';
import './CargaMasiva.css';

// Lista estándar de tipos de comprobante
const TIPOS_DOCUMENTO_OPCIONES = [
  { codigo: '01', label: '01 - Factura Electrónica' },
  { codigo: '03', label: '03 - Boleta de Venta' },
  { codigo: '07', label: '07 - Nota de Crédito' },
  { codigo: '08', label: '08 - Nota de Débito' },
  { codigo: 'R1', label: 'R1 - Recibo por Honorarios' },
  { codigo: 'VP', label: 'VP - Vale de Movilidad / Refrigerio' },
  { codigo: 'RP', label: 'RP - Recibo Provisional' },
  { codigo: 'DP', label: 'DP - Devolución de Peaje' },
  { codigo: '00', label: '00 - Otros Comprobantes' },
];

const CargaMasiva = () => {
  const navigate = useNavigate();
  const { user, isColaborador } = useAuth();
  const fileInputRef = useRef(null);

  // Estados de flujo
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Review & Edit, 3: Completed
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingOcr, setProcessingOcr] = useState(false);
  const [ocrProgressMsg, setOcrProgressMsg] = useState('');

  // Catálogos
  const [tiposGasto, setTiposGasto] = useState([]);
  const [tiposOrdenInterna, setTiposOrdenInterna] = useState([]);

  // Documentos extraídos y editables
  const [documentos, setDocumentos] = useState([]);

  // Acciones rápidas globales
  const [quickTipoGasto, setQuickTipoGasto] = useState('');
  const [quickCCosto, setQuickCCosto] = useState('');

  // Modal de vista previa de texto OCR
  const [rawOcrModal, setRawOcrModal] = useState({ show: false, title: '', content: '' });

  // Estado de guardado masivo
  const [savingBatch, setSavingBatch] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Cargar catálogos al montar
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [tgData, toiData] = await Promise.all([
          apiService.getTiposGasto().catch(() => []),
          apiService.getTiposOrdenInterna().catch(() => [])
        ]);
        setTiposGasto(Array.isArray(tgData) ? tgData : []);
        setTiposOrdenInterna(Array.isArray(toiData) ? toiData : []);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    };
    fetchCatalogos();
  }, []);

  // --- PARSERS Y FORMATEADORES ---
  const parseOcrDate = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr.trim() === '') {
      return '';
    }
    const clean = dateStr.trim();
    // Caso DD/MM/YYYY o DD-MM-YYYY
    if (clean.includes('/') || clean.includes('-')) {
      const parts = clean.split(/[/ -]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          let y = parts[2];
          if (y.length === 2) y = `20${y}`;
          return `${y}-${m}-${d}`;
        }
      }
    }
    // Caso YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }
    // Intento con objeto Date
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return '';
  };

  const parseTipoDocumento = (tipoStr = '') => {
    const t = tipoStr.toLowerCase();
    if (t.includes('factura') || t === '01') return '01';
    if (t.includes('boleta') || t === '03') return '03';
    if (t.includes('nota de credito') || t.includes('nota de crédito') || t === '07') return '07';
    if (t.includes('nota de debito') || t.includes('nota de débito') || t === '08') return '08';
    if (t.includes('honorario') || t.includes('recibo por honorario') || t === 'r1') return 'R1';
    if (t.includes('movilidad') || t.includes('refrigerio') || t.includes('vale')) return 'VP';
    if (t.includes('provisional') || t.includes('recibo provisional')) return 'RP';
    if (t.includes('peaje')) return 'DP';
    return '01'; // Por defecto factura o comprobante estándar
  };

  const parseMonto = (importeStr) => {
    if (!importeStr) return 0;
    const clean = importeStr.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // --- MANEJO DE ARCHIVOS ---
  const handleFileSelect = (files) => {
    const allowedExtensions = ['.pdf', '.xml', '.jpg', '.jpeg', '.png', '.webp'];
    const validFiles = Array.from(files).filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (validFiles.length < files.length) {
      alert('Algunos archivos no tienen formato válido (.pdf, .xml, .jpg, .jpeg, .png, .webp) y fueron ignorados.');
    }

    setSelectedFiles(prev => {
      // Evitar duplicados por nombre y tamaño
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newFiles = validFiles.filter(f => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...newFiles];
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- PROCESAMIENTO OCR MASIVO ---
  const handleProcesarOcr = async () => {
    if (selectedFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo para procesar.');
      return;
    }

    setProcessingOcr(true);
    setOcrProgressMsg(`Procesando ${selectedFiles.length} documento(s) con OCR...`);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('Files', file);
      });

      const resultadosOcr = await apiService.procesarDocumentosMasivo(formData);

      if (!Array.isArray(resultadosOcr) || resultadosOcr.length === 0) {
        alert('No se obtuvieron resultados del procesamiento.');
        setProcessingOcr(false);
        return;
      }

      // Convertir cada resultado OCR al modelo de DetalleDocumento editable
      const defaultCCosto = user?.centroCosto || user?.departamento || '';

      const mappedDocs = resultadosOcr.map((res, index) => {
        const tipoDoc = parseTipoDocumento(res.tipo || '');
        const ruc = res.codigo && (res.codigo.length === 11 || res.codigo.length === 8)
          ? res.codigo
          : (res.ruc_Proveedor || '');

        return {
          idTemp: `doc-${Date.now()}-${index}`,
          archivoOrigen: res.archivoOrigen || selectedFiles[index]?.name || `Archivo #${index + 1}`,
          textoOcr: res.texto_ocr || '',
          ocrError: res.error || null,
          // Campos DetalleDocumentoDTO
          tipoDocumento: tipoDoc,
          ruc_Proveedor: ruc,
          serieCorrelativo: res.numero_documento || '',
          fechaEmision: parseOcrDate(res.fecha),
          monto: parseMonto(res.importe),
          moneda: 'PEN',
          idTipoGasto: '',
          cCosto: res.crp || defaultCCosto,
          tipoOrdenInterna: '',
          descripcion: res.descripcion || '',
          comentario: res.beneficiario || '',
          placa: '',
          // Estados de guardado
          saveStatus: res.error ? 'error' : 'idle', // idle | saving | success | error
          saveErrorMsg: res.error ? `Error OCR: ${res.error}` : null
        };
      });

      setDocumentos(mappedDocs);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error al procesar archivos masivos:', error);
      alert('Ocurrió un error al procesar los archivos: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingOcr(false);
      setOcrProgressMsg('');
    }
  };

  // --- EDICIÓN DE DOCUMENTOS ---
  const handleDocChange = (idTemp, field, value) => {
    setDocumentos(prev =>
      prev.map(doc => {
        if (doc.idTemp === idTemp) {
          return {
            ...doc,
            [field]: value,
            // Al editar cualquier campo, limpiamos el estado de error para permitir reintentar
            saveStatus: doc.saveStatus === 'error' ? 'idle' : doc.saveStatus,
            saveErrorMsg: doc.saveStatus === 'error' ? null : doc.saveErrorMsg
          };
        }
        return doc;
      })
    );
  };

  const handleRemoveDoc = (idTemp) => {
    setDocumentos(prev => {
      const next = prev.filter(doc => doc.idTemp !== idTemp);
      if (next.length === 0) {
        setCurrentStep(1);
      }
      return next;
    });
  };

  const handleDuplicateDoc = (idTemp) => {
    const docToDup = documentos.find(d => d.idTemp === idTemp);
    if (!docToDup) return;
    const newDoc = {
      ...docToDup,
      idTemp: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      archivoOrigen: `${docToDup.archivoOrigen} (Copia)`,
      saveStatus: 'idle',
      saveErrorMsg: null
    };
    setDocumentos(prev => [...prev, newDoc]);
  };

  const handleAddManualDoc = () => {
    const defaultCCosto = user?.centroCosto || user?.departamento || '';
    const newDoc = {
      idTemp: `doc-manual-${Date.now()}`,
      archivoOrigen: 'Ingreso Manual',
      textoOcr: '',
      ocrError: null,
      tipoDocumento: '01',
      ruc_Proveedor: '',
      serieCorrelativo: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      monto: 0,
      moneda: 'PEN',
      idTipoGasto: '',
      cCosto: defaultCCosto,
      tipoOrdenInterna: '',
      descripcion: '',
      comentario: '',
      placa: '',
      saveStatus: 'idle',
      saveErrorMsg: null
    };
    setDocumentos(prev => [newDoc, ...prev]);
  };

  // Acciones Rápidas
  const applyQuickTipoGasto = () => {
    if (!quickTipoGasto) return;
    setDocumentos(prev =>
      prev.map(doc => ({
        ...doc,
        idTipoGasto: doc.idTipoGasto ? doc.idTipoGasto : quickTipoGasto
      }))
    );
  };

  const applyQuickCCosto = () => {
    if (!quickCCosto.trim()) return;
    setDocumentos(prev =>
      prev.map(doc => ({
        ...doc,
        cCosto: quickCCosto.trim()
      }))
    );
  };

  // --- GUARDADO INDIVIDUAL Y MASIVO ---
  const buildPayload = (doc) => {
    let fechaEmisionIso = new Date().toISOString();
    if (doc.fechaEmision) {
      const parsedDate = new Date(doc.fechaEmision);
      if (!isNaN(parsedDate.getTime())) {
        fechaEmisionIso = parsedDate.toISOString();
      }
    }

    return {
      userId: user?.id || user?.userId || 0,
      tipoDocumento: doc.tipoDocumento || '01',
      ruc_Proveedor: (doc.ruc_Proveedor || '').trim(),
      serieCorrelativo: (doc.serieCorrelativo || '').trim(),
      comentario: doc.comentario?.trim() || null,
      fechaEmision: fechaEmisionIso,
      fecha_Registro: new Date().toISOString(),
      imagenComprobante: null,
      sunatValido: false,
      sunatMensaje: null,
      monto: parseFloat(doc.monto) || 0,
      moneda: doc.moneda || 'PEN',
      idTipoGasto: doc.idTipoGasto ? parseInt(doc.idTipoGasto, 10) : null,
      cCosto: (doc.cCosto || user?.departamento || '').trim(),
      tipoOrdenInterna: doc.tipoOrdenInterna || null,
      descripcion: doc.descripcion?.trim() || null,
      placa: doc.placa?.trim() || null,
      tipoAprobacion: null,
      fechaAprobacion: null,
      aprobador: null,
      aprobadorNombre: null
    };
  };

  const validarDoc = (doc) => {
    const errors = [];
    if (!doc.tipoDocumento || !doc.tipoDocumento.trim()) {
      errors.push('Tipo de Documento es obligatorio');
    }
    if (!doc.ruc_Proveedor || !doc.ruc_Proveedor.trim()) {
      errors.push('RUC / Doc. Proveedor es obligatorio');
    }
    if (!doc.serieCorrelativo || !doc.serieCorrelativo.trim()) {
      errors.push('Serie - Correlativo es obligatorio');
    }
    if (!doc.fechaEmision || !doc.fechaEmision.trim() || isNaN(new Date(doc.fechaEmision).getTime())) {
      errors.push('Fecha de Emisión es obligatoria');
    }
    const montoNum = parseFloat(doc.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      errors.push('Monto Total debe ser mayor a 0');
    }
    if (!doc.cCosto || !doc.cCosto.trim()) {
      errors.push('Centro de Costo (CCosto) es obligatorio');
    }
    return errors;
  };

  const handleGuardarIndividual = async (idTemp) => {
    const doc = documentos.find(d => d.idTemp === idTemp);
    if (!doc) return;

    const valErrors = validarDoc(doc);
    if (valErrors.length > 0) {
      alert(`⚠️ No se puede registrar este comprobante:\n\n- ${valErrors.join('\n- ')}`);
      setDocumentos(prev =>
        prev.map(d => d.idTemp === idTemp ? { ...d, saveStatus: 'error', saveErrorMsg: valErrors.join(', ') } : d)
      );
      return;
    }

    setDocumentos(prev =>
      prev.map(d => d.idTemp === idTemp ? { ...d, saveStatus: 'saving', saveErrorMsg: null } : d)
    );

    try {
      const payload = buildPayload(doc);
      await apiService.registrarGasto(payload);

      setDocumentos(prev =>
        prev.map(d => d.idTemp === idTemp ? { ...d, saveStatus: 'success', saveErrorMsg: null } : d)
      );
    } catch (error) {
      const errText = error.response?.data?.message || error.response?.data?.msg || error.message || 'Error al registrar gasto';
      setDocumentos(prev =>
        prev.map(d => d.idTemp === idTemp ? { ...d, saveStatus: 'error', saveErrorMsg: errText } : d)
      );
    }
  };

  const handleGuardarTodos = async () => {
    const docsToSave = documentos.filter(d => d.saveStatus !== 'success');
    if (docsToSave.length === 0) {
      alert('Todos los comprobantes ya fueron registrados exitosamente.');
      return;
    }

    // 1. Validación previa exhaustiva de todos los documentos antes de guardar
    const erroresDetallados = [];
    docsToSave.forEach((doc, idx) => {
      const errors = validarDoc(doc);
      if (errors.length > 0) {
        erroresDetallados.push(`• Comprobante #${idx + 1} (${doc.archivoOrigen}): ${errors.join(', ')}`);
        // Marcamos visualmente el error en la tarjeta
        setDocumentos(prev =>
          prev.map(d => d.idTemp === doc.idTemp ? { ...d, saveStatus: 'error', saveErrorMsg: errors.join(', ') } : d)
        );
      }
    });

    if (erroresDetallados.length > 0) {
      alert(
        `⚠️ No se puede guardar. Se detectaron campos obligatorios faltantes o inválidos:\n\n${erroresDetallados.join('\n')}\n\nPor favor completa los campos señalados antes de guardar.`
      );
      return;
    }

    // 2. Ejecutar guardado en lote
    setSavingBatch(true);
    let okCount = 0;
    let failCount = 0;

    try {
      for (const doc of docsToSave) {
        setDocumentos(prev =>
          prev.map(d => d.idTemp === doc.idTemp ? { ...d, saveStatus: 'saving', saveErrorMsg: null } : d)
        );

        try {
          const payload = buildPayload(doc);
          await apiService.registrarGasto(payload);

          setDocumentos(prev =>
            prev.map(d => d.idTemp === doc.idTemp ? { ...d, saveStatus: 'success', saveErrorMsg: null } : d)
          );
          okCount++;
        } catch (error) {
          const errText = error.response?.data?.message || error.response?.data?.msg || error.message || 'Error al registrar';
          setDocumentos(prev =>
            prev.map(d => d.idTemp === doc.idTemp ? { ...d, saveStatus: 'error', saveErrorMsg: errText } : d)
          );
          failCount++;
        }
      }

      setSavedCount(prev => prev + okCount);
      setErrorCount(failCount);

      if (failCount === 0) {
        setCurrentStep(3);
      } else {
        alert(`Se registraron ${okCount} comprobante(s). Ocurrieron errores en ${failCount} comprobante(s). Revisa los mensajes en rojo y vuelve a intentar.`);
      }
    } catch (globalError) {
      console.error('Error imprevisto en guardado masivo:', globalError);
      alert('Ocurrió un error inesperado al guardar: ' + globalError.message);
    } finally {
      // Garantizar que el botón NUNCA quede bloqueado
      setSavingBatch(false);
    }
  };

  // Cálculos para resumen
  const totalDocs = documentos.length;
  const totalMontoSoles = documentos
    .filter(d => d.moneda === 'PEN')
    .reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0);
  const totalMontoDolares = documentos
    .filter(d => d.moneda === 'USD')
    .reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0);
  const docsGuardados = documentos.filter(d => d.saveStatus === 'success').length;

  return (
    <div className="carga-masiva-container">
      {/* Encabezado */}
      <div className="page-header">
        <h1 className="page-title">
          <UploadCloud size={30} style={{ color: 'var(--color-primary)' }} />
          Carga Masiva de Comprobantes
        </h1>
        <p className="page-subtitle">
          Sube tus archivos de comprobantes (PDF, XML, Imágenes) para procesar su información con OCR y registrar los gastos de forma rápida.
        </p>
      </div>

      {/* Tracker de Pasos */}
      <div className="steps-tracker">
        <div className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 1 ? <Check size={16} /> : '1'}
          </div>
          <div className="step-info">
            <span className="step-title">Paso 1: Subir Archivos</span>
            <span className="step-desc">Selecciona o arrastra documentos</span>
          </div>
        </div>

        <div className="step-divider"></div>

        <div className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 2 ? <Check size={16} /> : '2'}
          </div>
          <div className="step-info">
            <span className="step-title">Paso 2: Revisar y Editar</span>
            <span className="step-desc">Valida y completa los datos extraídos</span>
          </div>
        </div>

        <div className="step-divider"></div>

        <div className={`step-item ${currentStep === 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-info">
            <span className="step-title">Paso 3: Registro Completo</span>
            <span className="step-desc">Gastos registrados en el sistema</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIÓN Y SUBIDA DE ARCHIVOS                                    */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <>
          <div
            className={`dropzone-card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept=".pdf,.xml,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files);
                }
              }}
            />

            <div className="dropzone-icon-wrapper">
              <UploadCloud size={36} />
            </div>

            <h3 className="dropzone-title">Haz clic para subir o arrastra tus archivos aquí</h3>
            <p className="dropzone-subtitle">
              Puedes subir facturas, boletas, notas de crédito, vales de movilidad o recibos en lote.
            </p>

            <div className="dropzone-formats">
              <span className="format-badge">PDF</span>
              <span className="format-badge">XML SUNAT</span>
              <span className="format-badge">JPG / PNG / WEBP</span>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="files-preview-section">
              <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Archivos Seleccionados ({selectedFiles.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={clearSelectedFiles} icon={<Trash2 size={15} />}>
                  Limpiar lista
                </Button>
              </div>

              <div className="files-grid">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="file-card">
                    <div className="file-info">
                      <FileText size={24} className="file-icon" />
                      <div>
                        <div className="file-name" title={file.name}>{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      className="file-delete-btn"
                      title="Eliminar archivo"
                      onClick={() => removeSelectedFile(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={processingOcr ? <RotateCcw size={18} className="spinner-icon" /> : <Sparkles size={18} />}
                  disabled={processingOcr}
                  onClick={handleProcesarOcr}
                >
                  {processingOcr ? ocrProgressMsg : `Procesar ${selectedFiles.length} archivo(s) con OCR`}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: REVISIÓN Y EDICIÓN DE COMPROBANTES                                */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <>
          {/* Barra de Estadísticas */}
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eff6ff', color: 'var(--color-primary)' }}>
                <Receipt size={22} />
              </div>
              <div>
                <div className="stat-value">{totalDocs}</div>
                <div className="stat-label">Comprobantes</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f0fdf4', color: 'var(--color-success)' }}>
                <Coins size={22} />
              </div>
              <div>
                <div className="stat-value">S/ {totalMontoSoles.toFixed(2)}</div>
                <div className="stat-label">Total en Soles (PEN)</div>
              </div>
            </div>

            {totalMontoDolares > 0 && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7', color: 'var(--color-warning)' }}>
                  <Coins size={22} />
                </div>
                <div>
                  <div className="stat-value">$ {totalMontoDolares.toFixed(2)}</div>
                  <div className="stat-label">Total en Dólares (USD)</div>
                </div>
              </div>
            )}

            <div className="stat-card">
              <div className="stat-icon" style={{ background: docsGuardados === totalDocs ? '#f0fdf4' : '#f8fafc', color: docsGuardados === totalDocs ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                <FileCheck size={22} />
              </div>
              <div>
                <div className="stat-value">{docsGuardados} / {totalDocs}</div>
                <div className="stat-label">Registrados</div>
              </div>
            </div>
          </div>

          {/* Barra de Herramientas de Edición Rápida Masiva */}
          <div className="batch-tools-bar">
            <div className="quick-fill-group">
              <span className="quick-fill-label">
                <Layers size={16} /> Aplicar a todos los vacíos:
              </span>

              {/* Rellenar Tipo de Gasto */}
              <select
                className="quick-fill-select"
                value={quickTipoGasto}
                onChange={(e) => setQuickTipoGasto(e.target.value)}
              >
                <option value="">-- Seleccionar Tipo de Gasto --</option>
                {tiposGasto.map(tg => (
                  <option key={tg.id} value={tg.id}>{tg.nombre || tg.descripcion}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={applyQuickTipoGasto} disabled={!quickTipoGasto}>
                Asignar Gasto
              </Button>

              {/* Rellenar Centro de Costo */}
              <input
                className="quick-fill-input"
                placeholder="Centro de Costo (CCosto)"
                value={quickCCosto}
                onChange={(e) => setQuickCCosto(e.target.value)}
                style={{ width: '160px' }}
              />
              <Button variant="outline" size="sm" onClick={applyQuickCCosto} disabled={!quickCCosto.trim()}>
                Asignar CCosto
              </Button>
            </div>

            <div>
              <Button variant="outline" size="sm" icon={<Plus size={16} />} onClick={handleAddManualDoc}>
                Añadir Comprobante Manual
              </Button>
            </div>
          </div>

          {/* Lista de Tarjetas de Documento */}
          <div className="document-cards-list">
            {documentos.map((doc, index) => {
              const isSuccess = doc.saveStatus === 'success';
              const isError = doc.saveStatus === 'error';
              const isSaving = doc.saveStatus === 'saving';

              let borderClass = '';
              if (isSuccess) borderClass = 'success-border';
              else if (isError) borderClass = 'error-border';
              else if (isSaving) borderClass = 'saving-border';

              return (
                <div key={doc.idTemp} className={`doc-card ${borderClass}`}>
                  {/* Encabezado de la Tarjeta */}
                  <div className="doc-card-header">
                    <div className="doc-card-title">
                      <span className="doc-index-badge">#{index + 1}</span>
                      <span className="doc-file-tag">
                        <FileText size={16} className="text-secondary" />
                        {doc.archivoOrigen}
                      </span>

                      {/* Estado del Registro */}
                      {isSuccess && <Badge variant="success">✓ Guardado con Éxito</Badge>}
                      {isError && <Badge variant="danger">⚠️ Error en Registro</Badge>}
                      {isSaving && <Badge variant="warning">Guardando...</Badge>}
                      {doc.saveStatus === 'idle' && <Badge variant="neutral">Pendiente</Badge>}
                    </div>

                    <div className="doc-card-actions">
                      {doc.textoOcr && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={14} />}
                          onClick={() => setRawOcrModal({
                            show: true,
                            title: `Texto OCR extraído - ${doc.archivoOrigen}`,
                            content: doc.textoOcr
                          })}
                        >
                          Ver OCR
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => handleDuplicateDoc(doc.idTemp)}
                        title="Duplicar este comprobante"
                      >
                        Duplicar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleRemoveDoc(doc.idTemp)}
                        title="Eliminar de la lista"
                      >
                        Eliminar
                      </Button>

                      {!isSuccess && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Save size={14} />}
                          disabled={isSaving}
                          onClick={() => handleGuardarIndividual(doc.idTemp)}
                        >
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mensaje de Error si existiera */}
                  {doc.saveErrorMsg && (
                    <div style={{
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger-text)',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <AlertCircle size={15} />
                      {doc.saveErrorMsg}
                    </div>
                  )}

                  {/* Cuerpo con Inputs Editables */}
                  <div className="doc-card-body">
                    {/* Tipo de Documento */}
                    <div className="doc-field">
                      <label className="doc-label required">Tipo Documento</label>
                      <select
                        className="doc-select"
                        value={doc.tipoDocumento}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'tipoDocumento', e.target.value)}
                      >
                        {TIPOS_DOCUMENTO_OPCIONES.map(opt => (
                          <option key={opt.codigo} value={opt.codigo}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* RUC / Documento Proveedor */}
                    <div className="doc-field">
                      <label className="doc-label required">RUC / Doc. Proveedor</label>
                      <input
                        className="doc-input"
                        placeholder="20123456789"
                        maxLength={11}
                        value={doc.ruc_Proveedor}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'ruc_Proveedor', e.target.value)}
                      />
                    </div>

                    {/* Serie - Correlativo */}
                    <div className="doc-field">
                      <label className="doc-label required">Serie - Correlativo</label>
                      <input
                        className="doc-input"
                        placeholder="F001-0001234"
                        value={doc.serieCorrelativo}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'serieCorrelativo', e.target.value)}
                      />
                    </div>

                    {/* Fecha de Emisión */}
                    <div className="doc-field">
                      <label className="doc-label required">Fecha Emisión</label>
                      <input
                        className="doc-input"
                        type="date"
                        value={doc.fechaEmision}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'fechaEmision', e.target.value)}
                      />
                    </div>

                    {/* Monto */}
                    <div className="doc-field">
                      <label className="doc-label required">Monto Total</label>
                      <input
                        className="doc-input"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={doc.monto}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'monto', e.target.value)}
                      />
                    </div>

                    {/* Moneda */}
                    <div className="doc-field">
                      <label className="doc-label required">Moneda</label>
                      <select
                        className="doc-select"
                        value={doc.moneda}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'moneda', e.target.value)}
                      >
                        <option value="PEN">PEN (Soles - S/)</option>
                        <option value="USD">USD (Dólares - $)</option>
                      </select>
                    </div>

                    {/* Tipo de Gasto */}
                    <div className="doc-field">
                      <label className="doc-label">Tipo de Gasto</label>
                      <select
                        className="doc-select"
                        value={doc.idTipoGasto}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'idTipoGasto', e.target.value)}
                      >
                        <option value="">-- Sin Asignar --</option>
                        {tiposGasto.map(tg => (
                          <option key={tg.id} value={tg.id}>{tg.nombre || tg.descripcion}</option>
                        ))}
                      </select>
                    </div>

                    {/* Centro de Costo (CCosto) */}
                    <div className="doc-field">
                      <label className="doc-label required">Centro Costo (CCosto)</label>
                      <input
                        className="doc-input"
                        placeholder="ej. OPERACIONES / 102030"
                        value={doc.cCosto}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'cCosto', e.target.value)}
                      />
                    </div>

                    {/* Tipo de Orden Interna (Opcional) */}
                    <div className="doc-field">
                      <label className="doc-label">Orden Interna (Opcional)</label>
                      <select
                        className="doc-select"
                        value={doc.tipoOrdenInterna}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'tipoOrdenInterna', e.target.value)}
                      >
                        <option value="">-- Ninguna --</option>
                        {tiposOrdenInterna.map(toi => (
                          <option key={toi.id || toi.nombre} value={toi.nombre}>{toi.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Placa (Opcional) */}
                    <div className="doc-field">
                      <label className="doc-label">Placa (Opcional)</label>
                      <input
                        className="doc-input"
                        placeholder="ej. ABC-123"
                        value={doc.placa}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'placa', e.target.value)}
                      />
                    </div>

                    {/* Descripción / Concepto */}
                    <div className="doc-field full-width">
                      <label className="doc-label">Descripción / Concepto del Gasto</label>
                      <input
                        className="doc-input"
                        placeholder="Detalle o descripción de los productos / servicios consumidos"
                        value={doc.descripcion}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'descripcion', e.target.value)}
                      />
                    </div>

                    {/* Comentario / Beneficiario */}
                    <div className="doc-field full-width">
                      <label className="doc-label">Beneficiario / Comentario</label>
                      <input
                        className="doc-input"
                        placeholder="Nombre de la empresa proveedora, beneficiario o notas"
                        value={doc.comentario}
                        disabled={isSuccess}
                        onChange={(e) => handleDocChange(doc.idTemp, 'comentario', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Pie de tarjeta con info SUNAT */}
                  <div className="doc-card-footer">
                    <span>Validación SUNAT: <strong>En blanco (manual)</strong></span>
                    <span>Colaborador: <strong>{user?.nombreCompleto || user?.nombre || 'Usuario'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra Flotante de Acciones Inferiores */}
          <div className="bottom-sticky-bar">
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="md"
                icon={<RotateCcw size={16} />}
                disabled={savingBatch}
                onClick={() => {
                  if (window.confirm('¿Deseas regresar a la subida de archivos? Se perderán las modificaciones no guardadas.')) {
                    setCurrentStep(1);
                  }
                }}
              >
                Volver a Subir
              </Button>
            </div>

            {savingBatch && (
              <div className="progress-banner">
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Guardando comprobantes en el sistema...
                </span>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(docsGuardados / totalDocs) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-4 items-center">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {docsGuardados} de {totalDocs} guardados
              </span>

              {docsGuardados === totalDocs && totalDocs > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<CheckCircle2 size={18} />}
                  onClick={() => {
                    setSavedCount(docsGuardados);
                    setCurrentStep(3);
                  }}
                >
                  Finalizar y Ver Resumen ({docsGuardados})
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={savingBatch ? <RotateCcw size={18} className="spinner-icon" /> : <Save size={18} />}
                  disabled={savingBatch}
                  onClick={handleGuardarTodos}
                >
                  {savingBatch ? 'Guardando...' : `Guardar Todos los Gastos (${totalDocs - docsGuardados})`}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: RESUMEN DE REGISTRO COMPLETADO                                    */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <Card style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <CheckCircle2 size={42} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            ¡Gastos Registrados Exitosamente!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
            Se registraron correctamente <strong>{savedCount}</strong> comprobante(s) en el sistema. Puedes consultar el estado de aprobación o agruparlos en una rendición.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="lg"
              icon={<RotateCcw size={18} />}
              onClick={() => {
                setSelectedFiles([]);
                setDocumentos([]);
                setCurrentStep(1);
              }}
            >
              Realizar Otra Carga Masiva
            </Button>

            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} />}
              onClick={() => navigate(isColaborador ? '/' : '/aprobaciones')}
            >
              {isColaborador ? 'Ir al Dashboard' : 'Ir a Mis Aprobaciones / Gastos'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISTA PREVIA TEXTO OCR                                          */}
      {/* ========================================================================= */}
      {rawOcrModal.show && (
        <div className="ocr-modal-overlay" onClick={() => setRawOcrModal({ show: false, title: '', content: '' })}>
          <div className="ocr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ocr-modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{rawOcrModal.title}</h3>
              <button
                className="file-delete-btn"
                onClick={() => setRawOcrModal({ show: false, title: '', content: '' })}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ocr-modal-body">
              {rawOcrModal.content || '(No se detectó texto en el OCR)'}
            </div>
            <div className="ocr-modal-footer">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRawOcrModal({ show: false, title: '', content: '' })}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargaMasiva;
