import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Building2, Calendar, X } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { regioesService, RegiaoListItem } from '../../services/regioes.service';

interface RegiaoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  regiao: RegiaoListItem | null;
}

export const RegiaoViewModal: React.FC<RegiaoViewModalProps> = ({
  isOpen,
  onClose,
  regiao,
}) => {
  // Buscar detalhes completos da regiao
  const { data: regiaoDetalhes, isLoading } = useQuery({
    queryKey: ['regiao', regiao?.id],
    queryFn: () => regioesService.obter(regiao!.id),
    enabled: isOpen && !!regiao?.id,
  });

  if (!regiao) return null;

  const dados = regiaoDetalhes || regiao;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes da Regiao"
      size="md"
    >
      <div className="space-y-6">
        {/* Cabecalho com nome e cor */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: dados.cor }}
          >
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{dados.nome}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={dados.ativo ? 'success' : 'default'}>
                {dados.ativo ? 'Ativa' : 'Inativa'}
              </Badge>
              <span className="text-sm text-slate-500">
                Cor: {dados.cor}
              </span>
            </div>
          </div>
        </div>

        {/* Descricao */}
        {dados.descricao && (
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">Descricao</h4>
            <p className="text-slate-700 bg-slate-50 rounded-lg p-4">
              {dados.descricao}
            </p>
          </div>
        )}

        {/* Cidades vinculadas */}
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Cidades Vinculadas
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {regiaoDetalhes?.municipios?.length || regiao.totalMunicipios || 0}
            </span>
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : regiaoDetalhes?.municipios && regiaoDetalhes.municipios.length > 0 ? (
            <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {regiaoDetalhes.municipios.map((municipio) => (
                  <span
                    key={municipio.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {municipio.nome}
                    {municipio.estadoSigla && (
                      <span className="text-slate-400">- {municipio.estadoSigla}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-8 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhuma cidade vinculada</p>
            </div>
          )}
        </div>

        {/* Informacoes adicionais */}
        {regiaoDetalhes?.createdAt && (
          <div className="flex items-center gap-2 text-sm text-slate-500 pt-4 border-t border-slate-100">
            <Calendar className="w-4 h-4" />
            <span>
              Criada em: {new Date(regiaoDetalhes.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {/* Botao fechar */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
