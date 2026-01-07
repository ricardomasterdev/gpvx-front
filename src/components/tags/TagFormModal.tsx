import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, Save, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Select, Textarea } from '../ui';
import { tagsService, TagCreate, TagListItem, TagCategoria } from '../../services/tags.service';

// =====================================================
// Tipos
// =====================================================

interface TagFormData {
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  categoriaId?: string;
}

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: TagListItem | null;
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

export const TagFormModal: React.FC<TagFormModalProps> = ({
  isOpen,
  onClose,
  tag,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!tag;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<TagFormData>({
    defaultValues: {
      nome: '',
      descricao: '',
      cor: '#6B7280',
      icone: '',
      categoriaId: '',
    },
  });

  const corSelecionada = watch('cor');

  // Buscar dados completos da tag quando editar
  const { data: tagCompleta } = useQuery({
    queryKey: ['tag', tag?.id],
    queryFn: () => tagsService.obter(tag!.id),
    enabled: isOpen && isEditing && !!tag?.id,
  });

  // Buscar categorias para o select
  const { data: categorias = [] } = useQuery({
    queryKey: ['tagCategorias'],
    queryFn: () => tagsService.listarCategorias(),
    enabled: isOpen,
  });

  // Preencher form quando editar
  useEffect(() => {
    if (tagCompleta) {
      reset({
        nome: tagCompleta.nome,
        descricao: tagCompleta.descricao || '',
        cor: tagCompleta.cor || '#6B7280',
        icone: tagCompleta.icone || '',
        categoriaId: tagCompleta.categoriaId || '',
      });
    } else if (!isEditing) {
      reset({
        nome: '',
        descricao: '',
        cor: '#6B7280',
        icone: '',
        categoriaId: '',
      });
    }
  }, [tagCompleta, isEditing, reset, isOpen]);

  // Mutation para criar tag
  const createMutation = useMutation({
    mutationFn: (data: TagCreate) => tagsService.criar(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tags'], refetchType: 'all' });
      toast.success('Tag criada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar tag';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: TagCreate) =>
      tagsService.atualizar(tag!.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tags'], refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: ['tag', tag?.id] });
      toast.success('Tag atualizada com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar tag';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: TagFormData) => {
    const payload: TagCreate = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      cor: data.cor,
      icone: data.icone || undefined,
      categoriaId: data.categoriaId || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const categoriaOptions = [
    { value: '', label: 'Sem categoria' },
    ...categorias.map((c) => ({ value: c.id, label: c.nome })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Tag' : 'Nova Tag'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Preview da tag */}
        <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: corSelecionada }}
          >
            <Tag className="w-3.5 h-3.5" />
            {watch('nome') || 'Nome da Tag'}
          </span>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome *"
            placeholder="Nome da tag"
            {...register('nome', {
              required: 'Nome e obrigatorio',
              maxLength: { value: 100, message: 'Maximo 100 caracteres' },
            })}
            error={errors.nome?.message}
          />

          <Textarea
            label="Descricao"
            placeholder="Descricao da tag (opcional)"
            rows={3}
            {...register('descricao')}
          />

          <Controller
            name="categoriaId"
            control={control}
            render={({ field }) => (
              <Select
                label="Categoria"
                options={categoriaOptions}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
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
            {isEditing ? 'Salvar' : 'Criar Tag'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
