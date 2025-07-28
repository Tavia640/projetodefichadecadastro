import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/lib/authService';
import { Ficha } from '@/lib/fichaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

const VisualizarFicha = () => {
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);

  useEffect(() => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario) {
      navigate('/login');
      return;
    }

    // Recuperar ficha do localStorage
    const fichaString = localStorage.getItem('ficha_visualizar');
    if (!fichaString) {
      navigate(usuario.tipo === 'admin' ? '/dashboard-admin' : '/area-consultor');
      return;
    }

    try {
      const fichaData = JSON.parse(fichaString);
      setFicha({
        ...fichaData,
        dataEnvio: new Date(fichaData.dataEnvio),
        dataAceite: fichaData.dataAceite ? new Date(fichaData.dataAceite) : undefined,
        dataArquivamento: fichaData.dataArquivamento ? new Date(fichaData.dataArquivamento) : undefined
      });
    } catch (error) {
      console.error('Erro ao carregar ficha:', error);
      navigate(usuario.tipo === 'admin' ? '/dashboard-admin' : '/area-consultor');
    }
  }, [navigate]);

  const voltar = () => {
    const usuario = AuthService.getUsuarioLogado();
    localStorage.removeItem('ficha_visualizar');
    navigate(usuario?.tipo === 'admin' ? '/dashboard-admin' : '/area-consultor');
  };

  if (!ficha) {
    return <div>Carregando...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline">Pendente</Badge>;
      case 'aceita':
        return <Badge variant="default">Aceita</Badge>;
      case 'arquivada':
        return <Badge variant="secondary">Arquivada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={voltar} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Visualizar Ficha</h1>
        </div>

        {/* Informações da Ficha */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações da Ficha</CardTitle>
              {getStatusBadge(ficha.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Consultor</p>
                <p className="font-medium">{ficha.consultor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Envio</p>
                <p className="font-medium">{ficha.dataEnvio.toLocaleString('pt-BR')}</p>
              </div>
              {ficha.adminResponsavel && (
                <div>
                  <p className="text-sm text-muted-foreground">Administrador Responsável</p>
                  <p className="font-medium">{ficha.adminResponsavel}</p>
                </div>
              )}
              {ficha.dataAceite && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Aceite</p>
                  <p className="font-medium">{ficha.dataAceite.toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{ficha.dadosCliente.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{ficha.dadosCliente.cpf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{ficha.dadosCliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{ficha.dadosCliente.telefone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profissão</p>
                <p className="font-medium">{ficha.dadosCliente.profissao}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado Civil</p>
                <p className="font-medium">{ficha.dadosCliente.estadoCivil}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Negociação */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Negociação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Liner</p>
                <p className="font-medium">{ficha.dadosNegociacao.liner || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closer</p>
                <p className="font-medium">{ficha.dadosNegociacao.closer || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Venda</p>
                <p className="font-medium">{ficha.dadosNegociacao.tipoVenda || 'Não informado'}</p>
              </div>
            </div>

            {/* Contratos */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contratos</h4>
              {ficha.dadosNegociacao.contratos.map((contrato, index) => (
                <div key={contrato.id} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Empreendimento</p>
                      <p className="font-medium">{contrato.empreendimento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Torre/Apartamento</p>
                      <p className="font-medium">{contrato.torre} - {contrato.apartamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">R$ {parseFloat(contrato.valor || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Informações de Pagamento */}
            <div className="space-y-4 mt-6">
              <h4 className="font-semibold">Informações de Pagamento</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Tipo</th>
                      <th className="border border-border p-3 text-left">Total</th>
                      <th className="border border-border p-3 text-left">Parcelas</th>
                      <th className="border border-border p-3 text-left">Valor Parcela</th>
                      <th className="border border-border p-3 text-left">Forma Pagamento</th>
                      <th className="border border-border p-3 text-left">1º Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.dadosNegociacao.informacoesPagamento.map((info) => (
                      <tr key={info.id}>
                        <td className="border border-border p-3">{info.tipo}</td>
                        <td className="border border-border p-3">
                          R$ {parseFloat(info.total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-border p-3">{info.qtdParcelas}</td>
                        <td className="border border-border p-3">
                          R$ {parseFloat(info.valorParcela || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-border p-3">{info.formaPagamento}</td>
                        <td className="border border-border p-3">
                          {info.primeiroVencimento ? new Date(info.primeiroVencimento).toLocaleDateString('pt-BR') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualizarFicha;
