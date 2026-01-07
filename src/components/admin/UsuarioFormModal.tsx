import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, Smartphone, Building2, Save, Search, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { Modal, Button, Input } from '../ui';
import { adminService, UsuarioCreate, UsuarioListItem, GabineteListItem, PerfilListItem } from '../../services/admin.service';

// =====================================================
// Tipos
// =====================================================

interface UsuarioFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  celular: string;
  superUsuario: boolean;
}

// Mascara para celular (00) 00000-0000
const formatCelular = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: UsuarioListItem | null;
}

// =====================================================
// Componente
// =====================================================

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  isOpen,
  onClose,
  usuario,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!usuario;

  const [selectedGabinete, setSelectedGabinete] = useState<GabineteListItem | null>(null);
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGabineteList, setShowGabineteList] = useState(false);

  const [celularValue, setCelularValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      celular: '',
      superUsuario: false,
    },
  });

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCelular(e.target.value);
    setCelularValue(formatted);
    setValue('celular', formatted);
  };

  const superUsuario = watch('superUsuario');

  // Buscar gabinetes para selecao
  const { data: gabinetes = [] } = useQuery({
    queryKey: ['admin-gabinetes-all'],
    queryFn: () => adminService.listarGabinetes({ ativo: true }),
    enabled: isOpen,
  });

  // Buscar perfis do gabinete selecionado
  const { data: perfis = [] } = useQuery({
    queryKey: ['admin-perfis', selectedGabinete?.id],
    queryFn: () => adminService.listarPerfis(selectedGabinete?.id),
    enabled: isOpen && !!selectedGabinete,
  });

  // Filtrar gabinetes pela busca
  const filteredGabinetes = gabinetes.filter((g) =>
    g.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preencher form quando editar
  useEffect(() => {
    if (usuario) {
      reset({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        confirmarSenha: '',
        celular: '',
        superUsuario: usuario.superUsuario,
      });
      setCelularValue('');
      if (usuario.gabineteId && usuario.gabineteNome) {
        setSelectedGabinete({
          id: usuario.gabineteId,
          nome: usuario.gabineteNome,
          codigo: '',
          ativo: true,
        });
      } else {
        setSelectedGabinete(null);
      }
      setSelectedPerfil(null); // Sera preenchido quando os perfis forem carregados
    } else {
      reset({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        celular: '',
        superUsuario: false,
      });
      setCelularValue('');
      setSelectedGabinete(null);
      setSelectedPerfil(null);
    }
    setSearchQuery('');
    setShowGabineteList(false);
  }, [usuario, reset, isOpen]);

  // Atualizar perfil selecionado quando perfis forem carregados (edicao)
  useEffect(() => {
    if (usuario?.perfilId && perfis.length > 0) {
      const perfil = perfis.find((p) => p.id === usuario.perfilId);
      if (perfil) {
        setSelectedPerfil(perfil);
      }
    }
  }, [usuario?.perfilId, perfis]);

  // Limpar perfil quando gabinete mudar
  useEffect(() => {
    if (!isEditing) {
      setSelectedPerfil(null);
    }
  }, [selectedGabinete, isEditing]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: UsuarioCreate) => adminService.criarUsuario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
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
    mutationFn: (data: Partial<UsuarioCreate>) =>
      adminService.atualizarUsuario(usuario!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
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
    setCelularValue('');
    setSelectedGabinete(null);
    setSelectedPerfil(null);
    setSearchQuery('');
    setShowGabineteList(false);
    onClose();
  };

  const onSubmit = (data: UsuarioFormData) => {
    // Validar gabinete se nao for super usuario
    if (!data.superUsuario && !selectedGabinete) {
      toast.error('Selecione um gabinete para o usuario');
      return;
    }

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

    // Limpar mascara do celular
    const celularLimpo = data.celular?.replace(/\D/g, '') || '';

    if (isEditing) {
      const payload: Partial<UsuarioCreate> = {
        nome: data.nome,
        email: data.email,
        superUsuario: data.superUsuario,
        gabineteId: data.superUsuario ? undefined : selectedGabinete?.id,
        perfilId: data.superUsuario ? undefined : selectedPerfil?.id,
      };

      // Incluir senha apenas se preenchida
      if (data.senha) {
        payload.senha = data.senha;
      }

      // Incluir celular se preenchido
      if (celularLimpo) payload.telefone = celularLimpo;

      updateMutation.mutate(payload);
    } else {
      const payload: UsuarioCreate = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        superUsuario: data.superUsuario,
        gabineteId: data.superUsuario ? undefined : selectedGabinete?.id,
        perfilId: data.superUsuario ? undefined : selectedPerfil?.id,
      };

      if (celularLimpo) payload.telefone = celularLimpo;

      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Usuario' : 'Novo Usuario'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Super Usuario Toggle */}
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-slate-900">Super Usuario</p>
              <p className="text-sm text-slate-500">Acesso a todos os gabinetes</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('superUsuario')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Gabinete (se nao for super usuario) */}
        {!superUsuario && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
              <Building2 className="w-4 h-4" />
              <span>Gabinete *</span>
            </div>

            {selectedGabinete ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                    {selectedGabinete.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedGabinete.nome}</p>
                    <p className="text-sm text-slate-500">{selectedGabinete.codigo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGabinete(null)}
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
                    placeholder="Buscar gabinete..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowGabineteList(true)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {showGabineteList && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                    {filteredGabinetes.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-sm">
                        Nenhum gabinete encontrado
                      </div>
                    ) : (
                      filteredGabinetes.map((gabinete) => (
                        <button
                          key={gabinete.id}
                          type="button"
                          onClick={() => {
                            setSelectedGabinete(gabinete);
                            setShowGabineteList(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-sm">
                            {gabinete.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{gabinete.nome}</p>
                            <p className="text-xs text-slate-500">{gabinete.codigo}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Perfil (se nao for super usuario e gabinete selecionado) */}
        {!superUsuario && selectedGabinete && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
              <Shield className="w-4 h-4" />
              <span>Perfil de Acesso</span>
            </div>

            <select
              value={selectedPerfil?.id || ''}
              onChange={(e) => {
                const perfil = perfis.find((p) => p.id === e.target.value);
                setSelectedPerfil(perfil || null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione um perfil</option>
              {perfis.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome} {perfil.descricao ? `- ${perfil.descricao}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              O perfil define as permissoes do usuario no sistema
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
                required: 'Campo obrigatorio',
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
                required: 'Campo obrigatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalido',
                },
              })}
              error={errors.email?.message}
            />
          </div>

          {/* Celular */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Smartphone className="w-4 h-4" />
              <span>Celular</span>
            </div>
            <Input
              placeholder="(00) 00000-0000"
              value={celularValue}
              onChange={handleCelularChange}
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
                required: !isEditing ? 'Campo obrigatorio' : false,
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
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
