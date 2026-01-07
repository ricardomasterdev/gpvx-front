import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Palette, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea } from '../ui';
import { categoriasService, CategoriaCreate, CategoriaListItem } from '../../services/demandas.service';

// =====================================================
// Tipos
// =====================================================

interface CategoriaFormData {
  nome: string;
  descricao: string;
  cor: string;
  slaDias: number;
}

interface CategoriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria?: CategoriaListItem | null;
}

const CORES_PREDEFINIDAS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#6B7280', // gray
];

// =====================================================
// Componente
// =====================================================

export const CategoriaFormModal: React.FC<CategoriaFormModalProps> = ({
  isOpen,
  onClose,
  categoria,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!categoria;

  const [corSelecionada, setCorSelecionada] = useState('#6B7280');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    defaultValues: {
      nome: '',
      descricao: '',
      cor: '#6B7280',
      slaDias: 30,
    },
  });

  // Preencher form quando editar
  useEffect(() => {
    if (categoria) {
      reset({
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        cor: categoria.cor,
        slaDias: categoria.slaDias,
      });
      setCorSelecionada(categoria.cor);
    } else {
      reset({
        nome: '',
        descricao: '',
        cor: '#6B7280',
        slaDias: 30,
      });
      setCorSelecionada('#6B7280');
    }
  }, [categoria, reset, isOpen]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: CategoriaCreate) => categoriasService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Tipo de demanda criado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar tipo de demanda';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: CategoriaCreate) => categoriasService.atualizar(categoria!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Tipo de demanda atualizado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar tipo de demanda';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setCorSelecionada('#6B7280');
    onClose();
  };

  const handleCorChange = (cor: string) => {
    setCorSelecionada(cor);
    setValue('cor', cor);
  };

  const onSubmit = (data: CategoriaFormData) => {
    const payload: CategoriaCreate = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      cor: corSelecionada,
      slaDias: data.slaDias,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Tipo de Demanda' : 'Novo Tipo de Demanda'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <Tag className="w-4 h-4" />
            <span>Nome do Tipo *</span>
          </div>
          <Input
            placeholder="Ex: Infraestrutura, Saude, Educacao..."
            {...register('nome', {
              required: 'Nome e obrigatorio',
              maxLength: { value: 100, message: 'Maximo 100 caracteres' },
            })}
            error={errors.nome?.message}
          />
        </div>

        {/* Descricao */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <Tag className="w-4 h-4" />
            <span>Descricao</span>
          </div>
          <Textarea
            placeholder="Descreva brevemente este tipo de demanda..."
            rows={3}
            {...register('descricao')}
          />
        </div>

        {/* Cor */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <Palette className="w-4 h-4" />
            <span>Cor</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CORES_PREDEFINIDAS.map((cor) => (
              <button
                key={cor}
                type="button"
                onClick={() => handleCorChange(cor)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  corSelecionada === cor
                    ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: cor }}
                title={cor}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2 border-slate-200"
              style={{ backgroundColor: corSelecionada }}
            />
            <Input
              type="text"
              value={corSelecionada}
              onChange={(e) => handleCorChange(e.target.value)}
              placeholder="#000000"
              className="w-28"
            />
          </div>
        </div>

        {/* SLA (Prazo padrao em dias) */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <Clock className="w-4 h-4" />
            <span>Prazo Padrao (dias)</span>
          </div>
          <Input
            type="number"
            min={1}
            max={365}
            {...register('slaDias', {
              valueAsNumber: true,
              min: { value: 1, message: 'Minimo 1 dia' },
              max: { value: 365, message: 'Maximo 365 dias' },
            })}
            error={errors.slaDias?.message}
          />
          <p className="mt-1 text-xs text-slate-500">
            Prazo padrao para conclusao deste tipo de demanda
          </p>
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
            {isEditing ? 'Salvar' : 'Criar Tipo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
