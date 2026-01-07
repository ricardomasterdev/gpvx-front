import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, Phone, Shield, Save, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Select } from '../ui';
import { usuariosService, UsuarioCreate, UsuarioListItem, PerfilListItem } from '../../services/usuarios.service';
import { maskPhone } from '../../utils/masks';
import { useAuthStore } from '../../stores/authStore';

// =====================================================
// Tipos
// =====================================================

interface UsuarioFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  perfilId: string;
  subgabineteId: string;
}

interface UsuarioGabineteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: UsuarioListItem | null;
}

// =====================================================
// Componente
// =====================================================

export const UsuarioGabineteFormModal: React.FC<UsuarioGabineteFormModalProps> = ({
  isOpen,
  onClose,
  usuario,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!usuario;

  const { subgabinetes, usuario: currentUser } = useAuthStore();
  // Coordenador de subgabinete nao pode escolher subgabinete (usuarios sao criados no seu proprio subgabinete)
  const canAssignSubgabinete = currentUser?.isAdminGabinete && !currentUser?.pertenceSubgabinete && subgabinetes && subgabinetes.length > 0;

  const [telefoneValue, setTelefoneValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      telefone: '',
      perfilId: '',
      subgabineteId: '',
    },
  });

  // Watch para os valores
  const perfilIdValue = watch('perfilId');
  const subgabineteIdValue = watch('subgabineteId');

  // Buscar perfis disponiveis
  const { data: perfis = [], isLoading: isLoadingPerfis, error: perfisError } = useQuery({
    queryKey: ['perfis-gabinete'],
    queryFn: () => usuariosService.listarPerfis(),
    enabled: isOpen,
  });

  // Log de debug para erro de perfis
  React.useEffect(() => {
    if (perfisError) {
      console.error('Erro ao carregar perfis:', perfisError);
      toast.error('Erro ao carregar perfis. Verifique suas permissoes.');
    }
  }, [perfisError]);

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = maskPhone(e.target.value);
    setTelefoneValue(formatted);
    setValue('telefone', formatted);
  };

  // Preencher form quando editar
  useEffect(() => {
    if (usuario) {
      reset({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        confirmarSenha: '',
        telefone: usuario.telefone || '',
        perfilId: usuario.perfilId || '',
        subgabineteId: usuario.subgabineteId || '',
      });
      setTelefoneValue(usuario.telefone || '');
    } else {
      reset({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        telefone: '',
        perfilId: '',
        subgabineteId: '',
      });
      setTelefoneValue('');
    }
  }, [usuario, reset, isOpen]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: UsuarioCreate) => usuariosService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-gabinete'] });
      toast.success('Usuario criado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar usuario';
      toast.error(message);
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: any) => usuariosService.atualizar(usuario!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-gabinete'] });
      toast.success('Usuario atualizado com sucesso!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar usuario';
      toast.error(message);
    },
  });

  const handleClose = () => {
    reset();
    setTelefoneValue('');
    onClose();
  };

  const onSubmit = (data: UsuarioFormData) => {
    // Validar senha no cadastro
    if (!isEditing && !data.senha) {
      toast.error('Senha e obrigatoria');
      return;
    }

    // Validar confirmacao de senha
    if (data.senha && data.senha !== data.confirmarSenha) {
      toast.error('As senhas nao conferem');
      return;
    }

    // Limpar mascara do telefone
    const telefoneLimpo = data.telefone?.replace(/\D/g, '') || '';

    if (isEditing) {
      const payload: any = {
        nome: data.nome,
        email: data.email,
        perfilId: data.perfilId || undefined,
        subgabineteId: data.subgabineteId || null,
      };

      // Incluir senha apenas se preenchida
      if (data.senha) {
        payload.senha = data.senha;
      }

      // Incluir telefone se preenchido
      if (telefoneLimpo) payload.telefone = telefoneLimpo;

      updateMutation.mutate(payload);
    } else {
      const payload: UsuarioCreate = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        perfilId: data.perfilId || undefined,
        subgabineteId: data.subgabineteId || undefined,
      };

      if (telefoneLimpo) payload.telefone = telefoneLimpo;

      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opcoes de perfil
  const perfilOptions = [
    { value: '', label: 'Selecione um perfil' },
    ...perfis.map((p) => ({
      value: p.id,
      label: `${p.nome}${p.descricao ? ` - ${p.descricao}` : ''}`,
    })),
  ];

  // Opcoes de subgabinete
  const subgabineteOptions = [
    { value: '', label: 'Gabinete Principal (sem subgabinete)' },
    ...subgabinetes.map((sg) => ({
      value: sg.id,
      label: sg.nome,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Usuario' : 'Novo Usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Perfil */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <Shield className="w-4 h-4" />
            <span>Perfil de Acesso *</span>
          </div>
          <Select
            options={perfilOptions}
            value={perfilIdValue}
            onChange={(value) => setValue('perfilId', value, { shouldValidate: true })}
            error={errors.perfilId?.message}
            disabled={isLoadingPerfis}
          />
          {/* Campo oculto para validacao */}
          <input type="hidden" {...register('perfilId', { required: 'Perfil e obrigatorio' })} />
          <p className="mt-1 text-xs text-slate-500">
            O perfil define as permissoes do usuario no sistema
          </p>
        </div>

        {/* Subgabinete - apenas para admins com subgabinetes */}
        {canAssignSubgabinete && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Layers className="w-4 h-4" />
              <span>Subgabinete</span>
            </div>
            <Select
              options={subgabineteOptions}
              value={subgabineteIdValue}
              onChange={(value) => setValue('subgabineteId', value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Vincular usuario a um subgabinete especifico (opcional)
            </p>
          </div>
        )}

        {/* Grid de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <User className="w-4 h-4" />
              <span>Nome Completo *</span>
            </div>
            <Input
              placeholder="Nome do usuario"
              {...register('nome', {
                required: 'Nome e obrigatorio',
                maxLength: { value: 200, message: 'Maximo 200 caracteres' },
              })}
              error={errors.nome?.message}
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Mail className="w-4 h-4" />
              <span>Email *</span>
            </div>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              {...register('email', {
                required: 'Email e obrigatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalido',
                },
              })}
              error={errors.email?.message}
            />
          </div>

          {/* Telefone */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Phone className="w-4 h-4" />
              <span>Telefone</span>
            </div>
            <Input
              placeholder="(00) 00000-0000"
              value={telefoneValue}
              onChange={handleTelefoneChange}
              maxLength={15}
            />
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>Senha {!isEditing && '*'}</span>
            </div>
            <Input
              type="password"
              placeholder={isEditing ? 'Deixe em branco para manter' : 'Minimo 6 caracteres'}
              {...register('senha', {
                minLength: { value: 6, message: 'Minimo 6 caracteres' },
                required: !isEditing ? 'Senha e obrigatoria' : false,
              })}
              error={errors.senha?.message}
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>Confirmar Senha</span>
            </div>
            <Input
              type="password"
              placeholder="Repita a senha"
              {...register('confirmarSenha')}
              error={errors.confirmarSenha?.message}
            />
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
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
