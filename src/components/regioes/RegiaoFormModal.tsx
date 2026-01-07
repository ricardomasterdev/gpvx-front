import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save, Palette, Search, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea, Select } from '../ui';
import { regioesService, RegiaoCreate, RegiaoListItem } from '../../services/regioes.service';
import { auxiliarService, EstadoSimples, MunicipioSimples } from '../../services/auxiliar.service';

// =====================================================
// Tipos
// =====================================================

interface RegiaoFormData {
  nome: string;
  descricao?: string;
  cor: string;
}

interface RegiaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  regiao?: RegiaoListItem | null;
}

// Cores pre-definidas para selecao
const CORES_OPTIONS = [
  { value: '#6B7280', label: 'Cinza' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#06B6D4', label: 'Ciano' },
];

// =====================================================
// Componente
// =====================================================

export const RegiaoFormModal: React.FC<RegiaoFormModalProps> = ({
  isOpen,
  onClose,
  regiao,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!regiao;

  // Estado para selecao de municipios
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [searchMunicipio, setSearchMunicipio] = useState('');
  const [selectedMunicipios, setSelectedMunicipios] = useState<MunicipioSimples[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<RegiaoFormData>({
    defaultValues: {
      nome: '',
      descricao: '',
      cor: '#6B7280',
    },
  });

  const corSelecionada = watch('cor');

  // Buscar dados completos da regiao quando editar
  const { data: regiaoCompleta } = useQuery({
    queryKey: ['regiao', regiao?.id],
    queryFn: () => regioesService.obter(regiao!.id),
    enabled: isOpen && isEditing && !!regiao?.id,
  });

  // Buscar estados
  const { data: estados = [] } = useQuery({
    queryKey: ['estados'],
    queryFn: () => auxiliarService.listarEstados(),
    enabled: isOpen,
  });

  // Buscar municipios do estado selecionado
  const { data: municipiosDisponiveis = [] } = useQuery({
    queryKey: ['municipios', selectedEstadoId, searchMunicipio],
    queryFn: () => auxiliarService.listarMunicipios(selectedEstadoId || undefined, searchMunicipio || undefined, 100),
    enabled: isOpen && !!selectedEstadoId,
  });

  // Municipios filtrados (removendo os ja selecionados)
  const municipiosFiltrados = useMemo(() => {
    const selectedIds = new Set(selectedMunicipios.map(m => m.id));
    return municipiosDisponiveis.filter(m => !selectedIds.has(m.id));
  }, [municipiosDisponiveis, selectedMunicipios]);

  // Preencher form quando editar
  useEffect(() => {
    if (regiaoCompleta) {
      reset({
        nome: regiaoCompleta.nome,
        descricao: regiaoCompleta.descricao || '',
        cor: regiaoCompleta.cor || '#6B7280',
      });
      // Mapear municipios da regiao para o formato correto
      setSelectedMunicipios(
        regiaoCompleta.municipios.map(m => ({
          id: m.id,
          nome: m.nome,
          estadoId: m.estadoId,
          estadoSigla: m.estadoSigla,
        }))
      );
    } else if (!isEditing && isOpen) {
      reset({
        nome: '',
        descricao: '',
        cor: '#6B7280',
      });
      setSelectedMunicipios([]);
      setSelectedEstadoId(null);
      setSearchMunicipio('');
    }
  }, [regiaoCompleta, isEditing, reset, isOpen]);

  // Mutation para criar regiao
  const createMutation = useMutation({
    mutationFn: (data: RegiaoCreate) => regioesService.criar(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['regioes'], refetchType: 'all' });
      toast.success('Regiao criada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar regiao';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: RegiaoCreate) =>
      regioesService.atualizar(regiao!.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['regioes'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['regiao', regiao?.id] });
      toast.success('Regiao atualizada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar regiao';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setSelectedMunicipios([]);
    setSelectedEstadoId(null);
    setSearchMunicipio('');
    onClose();
  };

  const onSubmit = (data: RegiaoFormData) => {
    const payload: RegiaoCreate = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      cor: data.cor,
      municipioIds: selectedMunicipios.map(m => m.id),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addMunicipio = (municipio: MunicipioSimples) => {
    setSelectedMunicipios(prev => [...prev, municipio]);
  };

  const removeMunicipio = (municipioId: string) => {
    setSelectedMunicipios(prev => prev.filter(m => m.id !== municipioId));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const estadoOptions = [
    { value: '', label: 'Selecione um estado' },
    ...estados.map((e) => ({ value: String(e.id), label: `${e.sigla} - ${e.nome}` })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Regiao' : 'Nova Regiao'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Preview da regiao */}
        <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: corSelecionada }}
          >
            <MapPin className="w-4 h-4" />
            {watch('nome') || 'Nome da Regiao'}
            {selectedMunicipios.length > 0 && (
              <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {selectedMunicipios.length} cidade(s)
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna esquerda - Dados basicos */}
          <div className="space-y-4">
            <Input
              label="Nome *"
              placeholder="Nome da regiao"
              {...register('nome', {
                required: 'Campo obrigatorio',
                maxLength: { value: 100, message: 'Maximo 100 caracteres' },
              })}
              error={errors.nome?.message}
            />

            <Textarea
              label="Descricao"
              placeholder="Descricao da regiao (opcional)"
              rows={3}
              {...register('descricao')}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cor
              </label>
              <Controller
                name="cor"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {CORES_OPTIONS.map((cor) => (
                      <button
                        key={cor.value}
                        type="button"
                        onClick={() => field.onChange(cor.value)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          field.value === cor.value
                            ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: cor.value }}
                        title={cor.label}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            <Input
              label="Cor personalizada"
              placeholder="#6B7280"
              leftIcon={<Palette className="w-4 h-4" />}
              {...register('cor')}
            />
          </div>

          {/* Coluna direita - Selecao de municipios */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adicionar Cidades
              </label>

              <Select
                label=""
                options={estadoOptions}
                value={selectedEstadoId ? String(selectedEstadoId) : ''}
                onChange={(value) => {
                  setSelectedEstadoId(value ? Number(value) : null);
                  setSearchMunicipio('');
                }}
              />
            </div>

            {selectedEstadoId && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cidade..."
                    value={searchMunicipio}
                    onChange={(e) => setSearchMunicipio(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {municipiosFiltrados.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    {municipiosFiltrados.slice(0, 20).map((municipio) => (
                      <button
                        key={municipio.id}
                        type="button"
                        onClick={() => addMunicipio(municipio)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center justify-between border-b border-slate-100 last:border-b-0"
                      >
                        <span>{municipio.nome}</span>
                        <Check className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Municipios selecionados */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cidades Selecionadas ({selectedMunicipios.length})
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2">
                {selectedMunicipios.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Nenhuma cidade selecionada
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedMunicipios.map((municipio) => (
                      <span
                        key={municipio.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {municipio.nome}
                        {municipio.estadoSigla && (
                          <span className="text-slate-400">/{municipio.estadoSigla}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMunicipio(municipio.id)}
                          className="ml-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botoes */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Salvar' : 'Criar Regiao'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
