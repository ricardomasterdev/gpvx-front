import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('E-mail invalido'),
  senha: z.string().min(1, 'Senha obrigatoria'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        email: data.email,
        senha: data.senha,
      });
      login(response.usuario, response.gabinete, response.token, response.refreshToken);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
        Entrar no Sistema
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
            error={errors.senha?.message}
            {...register('senha')}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-slate-600">Lembrar de mim</span>
          </label>
          <Link
            to="/esqueci-senha"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Entrar
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Precisa de acesso?{' '}
          <Link
            to="/solicitar-acesso"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Solicite aqui
          </Link>
        </p>
      </div>
    </Card>
  );
};
