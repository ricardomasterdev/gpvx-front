import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, User, Save, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input } from '../ui';
import { adminService, GabineteCreate, GabineteListItem, UsuarioListItem } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

// =====================================================
// Tipos
// =====================================================

interface GabineteFormData {
  nome: string;
}

interface GabineteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gabinete?: GabineteListItem | null;
}

// =====================================================
// Componente
// =====================================================

export const GabineteFormModal: React.FC<GabineteFormModalProps> = ({
  isOpen,
  onClose,
  gabinete,
}) => {
  const queryClient = useQueryClient();
  const { setGabinetes, usuario } = useAuthStore();
  const isEditing = !!gabinete;

  const [selectedParlamentar, setSelectedParlamentar] = useState<UsuarioListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GabineteFormData>({
    defaultValues: {
      nome: '',
    },
  });

  // Buscar usuarios para selecao de parlamentar
  const { data: usuarios = [] } = useQuery({
    queryKey: ['admin-usuarios-all'],
    queryFn: () => adminService.listarUsuarios({}),
    enabled: isOpen,
  });

  // Filtrar usuarios pela busca
  const filteredUsuarios = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preencher form quando editar
  useEffect(() => {
    if (gabinete) {
      reset({ nome: gabinete.nome });
      if (gabinete.parlamentar) {
        setSelectedParlamentar({
          id: gabinete.parlamentar.id,
          nome: gabinete.parlamentar.nome,
          email: gabinete.parlamentar.email,
          status: 'ativo',
          superUsuario: false,
          dataCriacao: '',
        });
      } else {
        setSelectedParlamentar(null);
      }
    } else {
      reset({ nome: '' });
      setSelectedParlamentar(null);
    }
    setSearchQuery('');
    setShowUserList(false);
  }, [gabinete, reset, isOpen]);

  // Funcao para recarregar lista de gabinetes do super usuario
  const refreshGabinetesList = async () => {
    if (usuario?.superUsuario) {
      try {
        const updatedUser = await authService.me();
        if (updatedUser.gabinetes) {
          setGabinetes(updatedUser.gabinetes);
        }
      } catch (error) {
        console.error('Erro ao atualizar lista de gabinetes:', error);
      }
    }
  };

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: GabineteCreate) => adminService.criarGabinete(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gabinetes'] });
      toast.success('Gabinete criado com sucesso!');
      await refreshGabinetesList();
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar gabinete';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: GabineteCreate) =>
      adminService.atualizarGabinete(gabinete!.id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gabinetes'] });
      toast.success('Gabinete atualizado com sucesso!');
      await refreshGabinetesList();
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar gabinete';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setSelectedParlamentar(null);
    setSearchQuery('');
    setShowUserList(false);
    onClose();
  };

  const onSubmit = (data: GabineteFormData) => {
    const payload: GabineteCreate = {
      nome: data.nome,
      // Usar null explicitamente quando nao tem parlamentar (para persistir a remocao)
      parlamentarId: selectedParlamentar?.id || null,
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
      title={isEditing ? 'Editar Gabinete' : 'Novo Gabinete'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome do Gabinete */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <Building2 className="w-4 h-4" />
            <span>Nome do Gabinete</span>
          </div>
          <Input
            placeholder="Ex: Gabinete do Deputado Silva"
            {...register('nome', {
              required: 'Nome e obrigatorio',
              maxLength: { value: 200, message: 'Maximo 200 caracteres' },
            })}
            error={errors.nome?.message}
          />
        </div>

        {/* Parlamentar */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <User className="w-4 h-4" />
            <span>Parlamentar (opcional)</span>
          </div>

          {/* Parlamentar selecionado */}
          {selectedParlamentar ? (
            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                  {selectedParlamentar.nome.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedParlamentar.nome}</p>
                  <p className="text-sm text-slate-500">{selectedParlamentar.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParlamentar(null)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowUserList(true)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Lista de usuarios */}
              {showUserList && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                  {filteredUsuarios.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-sm">
                      Nenhum usuario encontrado
                    </div>
                  ) : (
                    filteredUsuarios.map((usuario) => (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() => {
                          setSelectedParlamentar(usuario);
                          setShowUserList(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                          {usuario.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{usuario.nome}</p>
                          <p className="text-xs text-slate-500">{usuario.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Vincule um usuario do sistema como parlamentar deste gabinete
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
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
