import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FichaCompleta } from '@/lib/fichaSupabaseService';
import { User, Phone, Mail, MapPin, CreditCard, FileText, Calendar } from 'lucide-react';

interface FichaVisualizationModalProps {
  ficha: FichaCompleta | null;
  open: boolean;
  onClose: () => void;
}

const FichaVisualizationModal: React.FC<FichaVisualizationModalProps> = ({
  ficha,
  open,
  onClose
}) => {
  if (!ficha) return null;

  const formatarData = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatarMoeda = (valor: string) => {
    const num = parseFloat(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ficha de Negociação - {ficha.dados_cliente.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Processo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Processo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Consultor:</span>
                <span>{ficha.nome_consultor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Data:</span>
                <span>{formatarData(ficha.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Status: {ficha.status}</Badge>
              </div>
              {ficha.nome_admin && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Admin Responsável:</span>
                  <span>{ficha.nome_admin}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Nome:</span>
                    <span>{ficha.dados_cliente.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">CPF:</span>
                    <span>{formatarCPF(ficha.dados_cliente.cpf)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">RG:</span>
                    <span>{ficha.dados_cliente.rg}</span>
                  </div>
                  {ficha.dados_cliente.profissao && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Profissão:</span>
                      <span>{ficha.dados_cliente.profissao}</span>
                    </div>
                  )}
                  {ficha.dados_cliente.estadoCivil && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-pink-500" />
                      <span className="font-medium">Estado Civil:</span>
                      <span>{ficha.dados_cliente.estadoCivil}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Telefone:</span>
                    <span>{ficha.dados_cliente.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Email:</span>
                    <span>{ficha.dados_cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Endereço:</span>
                    <span>
                      {[
                        ficha.dados_cliente.logradouro,
                        ficha.dados_cliente.numero,
                        ficha.dados_cliente.bairro,
                        ficha.dados_cliente.cidade,
                        ficha.dados_cliente.estado,
                        ficha.dados_cliente.cep
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  {ficha.dados_cliente.orgaoEmissor && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Órgão Emissor:</span>
                      <span>{ficha.dados_cliente.orgaoEmissor} - {ficha.dados_cliente.estadoEmissor}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cônjuge */}
          {(ficha.dados_cliente.nomeConjuge || ficha.dados_cliente.cpfConjuge) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Cônjuge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {ficha.dados_cliente.nomeConjuge && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Nome:</span>
                        <span>{ficha.dados_cliente.nomeConjuge}</span>
                      </div>
                    )}
                    {ficha.dados_cliente.cpfConjuge && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">CPF:</span>
                        <span>{formatarCPF(ficha.dados_cliente.cpfConjuge)}</span>
                      </div>
                    )}
                    {ficha.dados_cliente.rgConjuge && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">RG:</span>
                        <span>{ficha.dados_cliente.rgConjuge}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {ficha.dados_cliente.telefoneConjuge && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Telefone:</span>
                        <span>{ficha.dados_cliente.telefoneConjuge}</span>
                      </div>
                    )}
                    {ficha.dados_cliente.emailConjuge && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Email:</span>
                        <span>{ficha.dados_cliente.emailConjuge}</span>
                      </div>
                    )}
                    {ficha.dados_cliente.profissaoConjuge && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Profissão:</span>
                        <span>{ficha.dados_cliente.profissaoConjuge}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Logradouro:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.logradouro || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Número:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.numero || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Bairro:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.bairro || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Complemento:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.complemento || 'Não informado'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">CEP:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.cep || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Cidade:</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.cidade || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Estado (UF):</span>
                    <p className="text-sm text-gray-600">{ficha.dados_cliente.estado || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Negociação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados da Negociação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Liner:</span>
                  <p className="text-sm text-gray-600">{ficha.dados_negociacao.liner || 'Não informado'}</p>
                </div>
                <div>
                  <span className="font-medium">Closer:</span>
                  <p className="text-sm text-gray-600">{ficha.dados_negociacao.closer || 'Não informado'}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo de Venda:</span>
                  <Badge variant="secondary">{ficha.dados_negociacao.tipoVenda || 'Não informado'}</Badge>
                </div>
              </div>

              {/* Parcelas Pagas em Sala */}
              {ficha.dados_negociacao.parcelasPagasSala && ficha.dados_negociacao.parcelasPagasSala.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Parcelas Pagas em Sala:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 p-2 text-left">Tipo</th>
                          <th className="border border-gray-200 p-2 text-left">Valor Total</th>
                          <th className="border border-gray-200 p-2 text-left">Valor Distribuído</th>
                          <th className="border border-gray-200 p-2 text-left">Qtd. Cotas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ficha.dados_negociacao.parcelasPagasSala.map((parcela: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-2">{parcela.tipo}</td>
                            <td className="border border-gray-200 p-2">{formatarMoeda(parcela.valorTotal)}</td>
                            <td className="border border-gray-200 p-2">{formatarMoeda(parcela.valorDistribuido)}</td>
                            <td className="border border-gray-200 p-2">{parcela.quantidadeCotas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contratos */}
          {ficha.dados_negociacao.contratos && ficha.dados_negociacao.contratos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ficha.dados_negociacao.contratos.map((contrato: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-2">Contrato {index + 1}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Empreendimento:</span>
                          <p>{contrato.empreendimento}</p>
                        </div>
                        <div>
                          <span className="font-medium">Torre:</span>
                          <p>{contrato.torre}</p>
                        </div>
                        <div>
                          <span className="font-medium">Apartamento:</span>
                          <p>{contrato.apartamento}</p>
                        </div>
                        <div>
                          <span className="font-medium">Cota:</span>
                          <p>{contrato.cota}</p>
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span>
                          <p>{contrato.categoriaPreco}</p>
                        </div>
                        <div>
                          <span className="font-medium">Valor:</span>
                          <p className="font-bold text-green-600">{formatarMoeda(contrato.valor)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações de Pagamento */}
          {ficha.dados_negociacao.informacoesPagamento && ficha.dados_negociacao.informacoesPagamento.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left">Tipo</th>
                        <th className="border border-gray-200 p-2 text-left">Total</th>
                        <th className="border border-gray-200 p-2 text-left">Parcelas</th>
                        <th className="border border-gray-200 p-2 text-left">Valor/Parcela</th>
                        <th className="border border-gray-200 p-2 text-left">Forma Pag.</th>
                        <th className="border border-gray-200 p-2 text-left">1º Venc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.dados_negociacao.informacoesPagamento
                        .filter((info: any) => info.total && parseFloat(info.total) > 0)
                        .map((info: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-200 p-2 font-medium">{info.tipo}</td>
                          <td className="border border-gray-200 p-2">{formatarMoeda(info.total)}</td>
                          <td className="border border-gray-200 p-2">{info.qtdParcelas}</td>
                          <td className="border border-gray-200 p-2">{formatarMoeda(info.valorParcela)}</td>
                          <td className="border border-gray-200 p-2">{info.formaPagamento}</td>
                          <td className="border border-gray-200 p-2">
                            {info.primeiroVencimento ? new Date(info.primeiroVencimento).toLocaleDateString('pt-BR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FichaVisualizationModal;