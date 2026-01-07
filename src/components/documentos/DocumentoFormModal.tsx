import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, FileText, Upload, Calendar, Plus, ClipboardList, Search, Tag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button, Modal, SearchableSelect, Input, Textarea } from '../ui';
import { documentosService, Documento, DocumentoCreate, DocumentoUpdate } from '../../services/documentos.service';
import { compromissosService, CompromissoCreate } from '../../services/documentos.service';
import { pessoasService } from '../../services/pessoas.service';
import { demandasService, DemandaCreate, categoriasService, CategoriaListItem } from '../../services/demandas.service';
import { CategoriaFormModal } from '../demandas/CategoriaFormModal';
import { toast } from 'react-hot-toast';

interface DocumentoFormModalProps {
  documento?: Documento | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentoFormModal: React.FC<DocumentoFormModalProps> = ({
  documento,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!documento;

  // Form state
  const [titulo, setTitulo] = useState(documento?.titulo || '');
  const [descricao, setDescricao] = useState(documento?.descricao || '');
  const [dataDocumento, setDataDocumento] = useState(
    documento?.data_documento || format(new Date(), 'yyyy-MM-dd')
  );
  const [pessoaId, setPessoaId] = useState(documento?.pessoa_id || '');
  const [compromissoId, setCompromissoId] = useState(documento?.compromisso_id || '');
  const [tipoDocumento, setTipoDocumento] = useState(documento?.tipo_documento || '');
  const [observacoes, setObservacoes] = useState(documento?.observacoes || '');
  const [arquivoNome, setArquivoNome] = useState(documento?.arquivo_nome || '');
  const [arquivoUrl, setArquivoUrl] = useState(documento?.arquivo_url || '');

  // Modal de novo compromisso
  const [showNovoCompromisso, setShowNovoCompromisso] = useState(false);
  const [novoCompromissoTitulo, setNovoCompromissoTitulo] = useState('');
  const [novoCompromissoData, setNovoCompromissoData] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modal de nova demanda
  const [showNovaDemanda, setShowNovaDemanda] = useState(false);
  const [novaDemandaTitulo, setNovaDemandaTitulo] = useState('');
  const [novaDemandaDescricao, setNovaDemandaDescricao] = useState('');
  const [novaDemandaPrazo, setNovaDemandaPrazo] = useState('');
  const [novaDemandaPrioridade, setNovaDemandaPrioridade] = useState<'baixa' | 'normal' | 'alta' | 'urgente' | 'critica'>('normal');
  const [novaDemandaCategoriaId, setNovaDemandaCategoriaId] = useState('');

  // Estados para tipo de demanda (busca e modal)
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [tipoSearch, setTipoSearch] = useState('');
  const [showTipoResults, setShowTipoResults] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<CategoriaListItem | null>(null);
  const tipoRef = useRef<HTMLDivElement>(null);

  // Estados de erro para demanda
  const [demandaErrors, setDemandaErrors] = useState({
    titulo: false,
    descricao: false,
    categoriaId: false,
    prioridade: false,
    dataPrazo: false,
  });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tipoRef.current && !tipoRef.current.contains(event.target as Node)) {
        setShowTipoResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const PRIORIDADES_DEMANDA = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'normal', label: 'Normal' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
    { value: 'critica', label: 'Critica' },
  ];

  // Query para buscar pessoas
  const { data: pessoasData } = useQuery({
    queryKey: ['pessoas-simples'],
    queryFn: () => pessoasService.listarSimples(),
  });

  const pessoas = pessoasData || [];

  // Query para buscar compromissos
  const { data: compromissosData, refetch: refetchCompromissos } = useQuery({
    queryKey: ['compromissos-simples', pessoaId],
    queryFn: () => compromissosService.listarSimples(undefined, pessoaId || undefined),
    enabled: !!pessoaId,
  });

  const compromissos = compromissosData || [];

  // Query para buscar categorias de demanda
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-demanda'],
    queryFn: () => categoriasService.listar(true),
  });
  const categorias = categoriasData || [];

  // Opcoes para os selects
  const pessoasOptions = useMemo(() => [
    { value: '', label: 'Selecione uma pessoa...' },
    ...pessoas.map((p: any) => ({
      value: String(p.id),
      label: p.nome,
    }))
  ], [pessoas]);

  const compromissosOptions = useMemo(() => [
    { value: '', label: 'Nenhum compromisso' },
    ...compromissos.map((c: any) => ({
      value: String(c.id),
      label: `${c.titulo} (${format(new Date(c.data_inicio), 'dd/MM/yyyy')})`,
    }))
  ], [compromissos]);

  const tiposOptions = [
    { value: '', label: 'Selecione um tipo...' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'oficio', label: 'Oficio' },
    { value: 'requerimento', label: 'Requerimento' },
    { value: 'declaracao', label: 'Declaracao' },
    { value: 'certidao', label: 'Certidao' },
    { value: 'comprovante', label: 'Comprovante' },
    { value: 'outros', label: 'Outros' },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DocumentoCreate) => documentosService.criar(data),
    onSuccess: () => {
      toast.success('Documento criado com sucesso');
      onSuccess();
    },
    onError: () => {
      toast.error('Erro ao criar documento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentoUpdate }) =>
      documentosService.atualizar(id, data),
    onSuccess: () => {
      toast.success('Documento atualizado com sucesso');
      onSuccess();
    },
    onError: () => {
      toast.error('Erro ao atualizar documento');
    },
  });

  const createCompromissoMutation = useMutation({
    mutationFn: (data: CompromissoCreate) => compromissosService.criar(data),
    onSuccess: (compromisso) => {
      toast.success('Compromisso criado com sucesso');
      setCompromissoId(compromisso.id);
      setShowNovoCompromisso(false);
      setNovoCompromissoTitulo('');
      refetchCompromissos();
    },
    onError: () => {
      toast.error('Erro ao criar compromisso');
    },
  });

  const createDemandaMutation = useMutation({
    mutationFn: (data: DemandaCreate) => demandasService.criar(data),
    onSuccess: () => {
      toast.success('Demanda criada com sucesso');
      setShowNovaDemanda(false);
      setNovaDemandaTitulo('');
      setNovaDemandaDescricao('');
      setNovaDemandaPrazo('');
      setNovaDemandaPrioridade('normal');
      setNovaDemandaCategoriaId('');
      setTipoSearch('');
      setSelectedTipo(null);
      setShowTipoResults(false);
      setDemandaErrors({
        titulo: false,
        descricao: false,
        categoriaId: false,
        prioridade: false,
        dataPrazo: false,
      });
    },
    onError: () => {
      toast.error('Erro ao criar demanda');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('Titulo e obrigatorio');
      return;
    }

    if (!pessoaId) {
      toast.error('Pessoa e obrigatoria');
      return;
    }

    if (!dataDocumento) {
      toast.error('Data do documento e obrigatoria');
      return;
    }

    const data = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      data_documento: dataDocumento,
      pessoa_id: pessoaId,
      compromisso_id: compromissoId || undefined,
      tipo_documento: tipoDocumento || undefined,
      observacoes: observacoes.trim() || undefined,
      arquivo_nome: arquivoNome || undefined,
      arquivo_url: arquivoUrl || undefined,
    };

    if (isEditing && documento) {
      updateMutation.mutate({ id: documento.id, data });
    } else {
      createMutation.mutate(data as DocumentoCreate);
    }
  };

  const handleCreateCompromisso = () => {
    if (!novoCompromissoTitulo.trim()) {
      toast.error('Titulo do compromisso e obrigatorio');
      return;
    }

    createCompromissoMutation.mutate({
      titulo: novoCompromissoTitulo.trim(),
      data_inicio: novoCompromissoData,
      pessoa_id: pessoaId || undefined,
    });
  };

  const handleCreateDemanda = () => {
    const errors = {
      titulo: !novaDemandaTitulo.trim(),
      descricao: !novaDemandaDescricao.trim(),
      categoriaId: !novaDemandaCategoriaId,
      prioridade: !novaDemandaPrioridade,
      dataPrazo: !novaDemandaPrazo,
    };

    setDemandaErrors(errors);

    if (Object.values(errors).some(e => e)) {
      return;
    }

    createDemandaMutation.mutate({
      titulo: novaDemandaTitulo.trim(),
      descricao: novaDemandaDescricao.trim(),
      prioridade: novaDemandaPrioridade,
      categoriaId: novaDemandaCategoriaId,
      dataPrazo: novaDemandaPrazo,
      pessoaId: pessoaId || undefined,
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Editar Documento' : 'Novo Documento'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titulo */}
        <Input
          label="Titulo *"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Digite o titulo do documento..."
          leftIcon={<FileText className="w-4 h-4" />}
          required
        />

        {/* Pessoa (obrigatorio) */}
        <SearchableSelect
          label="Pessoa Vinculada *"
          value={pessoaId}
          onChange={setPessoaId}
          options={pessoasOptions}
          placeholder="Selecione uma pessoa..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data do Documento */}
          <Input
            label="Data do Documento *"
            type="date"
            value={dataDocumento}
            onChange={(e) => setDataDocumento(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />

          {/* Tipo de Documento */}
          <SearchableSelect
            label="Tipo de Documento"
            value={tipoDocumento}
            onChange={setTipoDocumento}
            options={tiposOptions}
            placeholder="Selecione um tipo..."
          />
        </div>

        {/* Descricao */}
        <Textarea
          label="Descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o documento..."
          rows={3}
        />

        {/* Compromisso Vinculado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Compromisso Vinculado
            </label>
            {pessoaId && (
              <button
                type="button"
                onClick={() => setShowNovoCompromisso(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Novo Compromisso
              </button>
            )}
          </div>
          <SearchableSelect
            value={compromissoId}
            onChange={setCompromissoId}
            options={compromissosOptions}
            placeholder="Selecione um compromisso..."
            disabled={!pessoaId}
          />
          {!pessoaId && (
            <p className="text-xs text-slate-500">Selecione uma pessoa primeiro</p>
          )}
        </div>

        {/* Novo Compromisso */}
        {showNovoCompromisso && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900">Novo Compromisso</h4>
              <button
                type="button"
                onClick={() => setShowNovoCompromisso(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Titulo *"
                value={novoCompromissoTitulo}
                onChange={(e) => setNovoCompromissoTitulo(e.target.value)}
                placeholder="Titulo do compromisso..."
              />
              <Input
                label="Data *"
                type="date"
                value={novoCompromissoData}
                onChange={(e) => setNovoCompromissoData(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCompromisso}
                isLoading={createCompromissoMutation.isPending}
              >
                Criar Compromisso
              </Button>
            </div>
          </div>
        )}

        {/* Demanda Vinculada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Demanda Vinculada
            </label>
            {pessoaId && (
              <button
                type="button"
                onClick={() => setShowNovaDemanda(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Nova Demanda
              </button>
            )}
          </div>
          {!pessoaId && (
            <p className="text-xs text-slate-500">Selecione uma pessoa primeiro para criar uma demanda</p>
          )}
        </div>

        {/* Nova Demanda */}
        {showNovaDemanda && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Nova Demanda
              </h4>
              <button
                type="button"
                onClick={() => setShowNovaDemanda(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Input
              label="Titulo da Demanda *"
              value={novaDemandaTitulo}
              onChange={(e) => {
                setNovaDemandaTitulo(e.target.value);
                if (demandaErrors.titulo) setDemandaErrors({ ...demandaErrors, titulo: false });
              }}
              placeholder="Descreva brevemente a demanda..."
              leftIcon={<FileText className="w-4 h-4" />}
              error={demandaErrors.titulo ? 'Campo obrigatorio' : undefined}
            />

            <Textarea
              label="Descricao *"
              value={novaDemandaDescricao}
              onChange={(e) => {
                setNovaDemandaDescricao(e.target.value);
                if (demandaErrors.descricao) setDemandaErrors({ ...demandaErrors, descricao: false });
              }}
              placeholder="Descreva detalhadamente a demanda..."
              rows={4}
              error={demandaErrors.descricao ? 'Campo obrigatorio' : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Demanda */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Tag className="w-4 h-4" />
                    <span>Tipo de Demanda *</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTipoModalOpen(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Novo Tipo
                  </button>
                </div>
                <div className="relative" ref={tipoRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar tipo de demanda..."
                      value={tipoSearch}
                      onChange={(e) => {
                        setTipoSearch(e.target.value);
                        setShowTipoResults(true);
                        if (demandaErrors.categoriaId) setDemandaErrors({ ...demandaErrors, categoriaId: false });
                        if (!e.target.value) {
                          setSelectedTipo(null);
                          setNovaDemandaCategoriaId('');
                        }
                      }}
                      onFocus={() => setShowTipoResults(true)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                        demandaErrors.categoriaId ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Resultados da busca */}
                  {showTipoResults && categorias.filter(c =>
                    c.nome.toLowerCase().includes(tipoSearch.toLowerCase())
                  ).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 overflow-auto">
                      {categorias
                        .filter(c => c.nome.toLowerCase().includes(tipoSearch.toLowerCase()))
                        .map((categoria) => (
                          <button
                            key={categoria.id}
                            type="button"
                            onClick={() => {
                              setSelectedTipo(categoria);
                              setTipoSearch(categoria.nome);
                              setNovaDemandaCategoriaId(categoria.id);
                              setShowTipoResults(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoria.cor }}
                            />
                            <span className="font-medium text-slate-900 text-sm">{categoria.nome}</span>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Nenhum resultado */}
                  {showTipoResults && tipoSearch && categorias.filter(c =>
                    c.nome.toLowerCase().includes(tipoSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-slate-500 text-sm">
                      Nenhum tipo encontrado
                    </div>
                  )}
                </div>
                {selectedTipo && (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedTipo.cor }}
                    />
                    <span className="text-sm text-slate-600">{selectedTipo.nome}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTipo(null);
                        setTipoSearch('');
                        setNovaDemandaCategoriaId('');
                      }}
                      className="text-xs text-slate-400 hover:text-red-500 ml-auto"
                    >
                      Limpar
                    </button>
                  </div>
                )}
                {demandaErrors.categoriaId && (
                  <p className="mt-1 text-xs text-red-500">Campo obrigatorio</p>
                )}
              </div>

              {/* Prioridade */}
              <div>
                <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Prioridade *</span>
                </div>
                <select
                  value={novaDemandaPrioridade}
                  onChange={(e) => {
                    setNovaDemandaPrioridade(e.target.value as any);
                    if (demandaErrors.prioridade) setDemandaErrors({ ...demandaErrors, prioridade: false });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                    demandaErrors.prioridade ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  {PRIORIDADES_DEMANDA.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {demandaErrors.prioridade && (
                  <p className="mt-1 text-xs text-red-500">Campo obrigatorio</p>
                )}
              </div>
            </div>

            {/* Data Prazo */}
            <div>
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm mb-2">
                <Calendar className="w-4 h-4" />
                <span>Prazo *</span>
              </div>
              <Input
                type="date"
                value={novaDemandaPrazo}
                onChange={(e) => {
                  setNovaDemandaPrazo(e.target.value);
                  if (demandaErrors.dataPrazo) setDemandaErrors({ ...demandaErrors, dataPrazo: false });
                }}
                error={demandaErrors.dataPrazo ? 'Campo obrigatorio' : undefined}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateDemanda}
                isLoading={createDemandaMutation.isPending}
              >
                Criar Demanda
              </Button>
            </div>
          </div>
        )}

        {/* Upload de Arquivo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Arquivo Digital
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF, DOC, DOCX, JPG, PNG (max. 10MB)
            </p>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setArquivoNome(file.name);
                  // TODO: Implementar upload real
                  toast.success(`Arquivo "${file.name}" selecionado`);
                }
              }}
            />
          </div>
          {arquivoNome && (
            <p className="text-sm text-slate-600">
              Arquivo: <span className="font-medium">{arquivoNome}</span>
            </p>
          )}
        </div>

        {/* Observacoes */}
        <Textarea
          label="Observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observacoes adicionais..."
          rows={2}
        />

        {/* Acoes */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Salvar Alteracoes' : 'Cadastrar Documento'}
          </Button>
        </div>
      </form>

      {/* Modal de Tipo de Demanda */}
      <CategoriaFormModal
        isOpen={tipoModalOpen}
        onClose={() => setTipoModalOpen(false)}
      />
    </Modal>
  );
};
