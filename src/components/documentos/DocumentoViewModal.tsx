import React from 'react';
import { FileText, Calendar, User, Link as LinkIcon, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Modal, Badge, Button } from '../ui';
import { Documento } from '../../services/documentos.service';

interface DocumentoViewModalProps {
  documento: Documento;
  onClose: () => void;
}

export const DocumentoViewModal: React.FC<DocumentoViewModalProps> = ({
  documento,
  onClose,
}) => {
  const tipoLabels: Record<string, string> = {
    contrato: 'Contrato',
    oficio: 'Oficio',
    requerimento: 'Requerimento',
    declaracao: 'Declaracao',
    certidao: 'Certidao',
    comprovante: 'Comprovante',
    outros: 'Outros',
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Detalhes do Documento"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header do Documento */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">
              {documento.titulo}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              {documento.tipo_documento && (
                <Badge variant="info">
                  {tipoLabels[documento.tipo_documento] || documento.tipo_documento}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {format(new Date(documento.data_documento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>

        {/* Informacoes Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pessoa Vinculada */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <User className="w-4 h-4" />
              Pessoa Vinculada
            </div>
            <p className="font-medium text-slate-900">
              {documento.pessoa_nome || 'Nao informado'}
            </p>
          </div>

          {/* Compromisso Vinculado */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <LinkIcon className="w-4 h-4" />
              Compromisso Vinculado
            </div>
            <p className="font-medium text-slate-900">
              {documento.compromisso_titulo || 'Nenhum compromisso'}
            </p>
          </div>
        </div>

        {/* Descricao */}
        {documento.descricao && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Descricao</h4>
            <p className="text-slate-700 whitespace-pre-wrap">{documento.descricao}</p>
          </div>
        )}

        {/* Arquivo */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="text-sm font-medium text-slate-500 mb-3">Arquivo Digital</h4>
          {documento.arquivo_nome ? (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{documento.arquivo_nome}</p>
                  <p className="text-xs text-slate-500">Clique para baixar</p>
                </div>
              </div>
              {documento.arquivo_url && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => {
                    if (documento.arquivo_url) {
                      window.open(documento.arquivo_url, '_blank');
                    }
                  }}
                >
                  Baixar
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 bg-white rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">Nenhum arquivo anexado</p>
            </div>
          )}
        </div>

        {/* Observacoes */}
        {documento.observacoes && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h4 className="text-sm font-medium text-amber-700 mb-2">Observacoes</h4>
            <p className="text-amber-900 whitespace-pre-wrap">{documento.observacoes}</p>
          </div>
        )}

        {/* Metadados */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>
              Criado em: {format(new Date(documento.created_at), "dd/MM/yyyy 'as' HH:mm")}
            </span>
            {documento.updated_at && documento.updated_at !== documento.created_at && (
              <span>
                Atualizado em: {format(new Date(documento.updated_at), "dd/MM/yyyy 'as' HH:mm")}
              </span>
            )}
          </div>
        </div>

        {/* Acoes */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
