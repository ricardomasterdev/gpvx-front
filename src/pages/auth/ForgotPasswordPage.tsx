import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('E-mail invalido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setEmailSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          E-mail Enviado!
        </h2>
        <p className="text-slate-500 mb-6">
          Verifique sua caixa de entrada e siga as instrucoes para redefinir sua senha.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            Voltar para o Login
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <Link
        to="/login"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Esqueceu sua senha?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Digite seu e-mail e enviaremos instrucoes para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Enviar Instrucoes
        </Button>
      </form>
    </Card>
  );
};
