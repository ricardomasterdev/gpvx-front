import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input } from '../ui';
import { adminService, SubgabineteCreate, SubgabineteListItem } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

// =====================================================
// Tipos
// =====================================================

interface SubgabineteFormData {
  nome: string;
}

interface SubgabineteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subgabinete?: SubgabineteListItem | null;
}

// =====================================================
// Componente
// =====================================================

export const SubgabineteFormModal: React.FC<SubgabineteFormModalProps> = ({
  isOpen,
  onClose,
  subgabinete,
}) => {
  const queryClient = useQueryClient();
  const { setSubgabinetes, usuario } = useAuthStore();
  const isEditing = !!subgabinete;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubgabineteFormData>({
    defaultValues: {
      nome: '',
    },
  });

  // Preencher form quando editar
  useEffect(() => {
    if (subgabinete) {
      reset({ nome: subgabinete.nome });
    } else {
      reset({ nome: '' });
    }
  }, [subgabinete, reset, isOpen]);

  // Funcao para recarregar lista de subgabinetes
  const refreshSubgabinetesList = async () => {
    if (usuario?.isAdminGabinete) {
      try {
        const updatedUser = await authService.me();
        if (updatedUser.subgabinetes) {
          setSubgabinetes(updatedUser.subgabinetes);
        }
      } catch (error) {
        console.error('Erro ao atualizar lista de subgabinetes:', error);
      }
    }
  };

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: SubgabineteCreate) => adminService.criarSubgabinete(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subgabinetes'] });
      toast.success('Subgabinete criado com sucesso!');
      await refreshSubgabinetesList();
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar subgabinete';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: SubgabineteCreate) =>
      adminService.atualizarSubgabinete(subgabinete!.id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subgabinetes'] });
      toast.success('Subgabinete atualizado com sucesso!');
      await refreshSubgabinetesList();
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar subgabinete';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: SubgabineteFormData) => {
    const payload: SubgabineteCreate = {
      nome: data.nome,
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
      title={isEditing ? 'Editar Subgabinete' : 'Novo Subgabinete'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome do Subgabinete */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <Layers className="w-4 h-4" />
            <span>Nome do Subgabinete</span>
          </div>
          <Input
            placeholder="Ex: Subgabinete Regional Norte"
            {...register('nome', {
              required: 'Campo obrigatorio',
              maxLength: { value: 200, message: 'Maximo 200 caracteres' },
            })}
            error={errors.nome?.message}
          />
          <p className="mt-2 text-xs text-slate-500">
            O codigo sera gerado automaticamente com base no gabinete principal
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
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
