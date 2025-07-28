import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthService, { FichaEnviada, Usuario } from '@/lib/auth';
import { PDFGenerator } from '@/lib/pdfGenerator';

const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fichasPendentes, setFichasPendentes] = useState<FichaEnviada[]>([]);
  const [fichasDoAdmin, setFichasDoAdmin] = useState<FichaEnviada[]>([]);
  const [fichaVizualizada, setFichaVizualizada] = useState<FichaEnviada | null>(null);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const usuarioLogado = AuthService.getUsuarioLogado();
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
      navigate('/login');
      return;
    }
    
    setUsuario(usuarioLogado);
    carregarFichas();
  }, [navigate]);

  const carregarFichas = () => {
    const pendentes = AuthService.getFichasPendentes();
    setFichasPendentes(pendentes);
    
    if (usuario) {
      const minhasFichas = AuthService.getFichasDoAdmin(usuario.id);
      setFichasDoAdmin(minhasFichas);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const aceitarFicha = (fichaId: string) => {
    const sucesso = AuthService.aceitarFicha(fichaId);
    if (sucesso) {
      setMensagem('Ficha aceita com sucesso!');
      carregarFichas();
      setTimeout(() => setMensagem(''), 3000);
    } else {
      setMensagem('Erro ao aceitar ficha.');
    }
  };

  const finalizarAtendimento = (fichaId: string) => {
    const confirmar = window.confirm('Tem certeza que deseja finalizar este atendimento?');
    if (confirmar) {
      const sucesso = AuthService.finalizarAtendimento(fichaId);
      if (sucesso) {
        setMensagem('Atendimento finalizado!');
        carregarFichas();
        setFichaVizualizada(null);
        setTimeout(() => setMensagem(''), 3000);
      } else {
        setMensagem('Erro ao finalizar atendimento.');
      }
    }
  };

  const visualizarFicha = (ficha: FichaEnviada) => {
    setFichaVizualizada(ficha);
  };

  const imprimirFicha = (ficha: FichaEnviada) => {
    try {
      // Gerar e imprimir PDFs
      const pdfCadastroBlob = PDFGenerator.gerarPDFCadastroClienteBlob(ficha.dadosCliente);
      const pdfNegociacaoBlob = PDFGenerator.gerarPDFNegociacaoBlob(ficha.dadosCliente, ficha.dadosNegociacao);

      // Abrir PDFs em novas janelas
      const urlCadastro = URL.createObjectURL(pdfCadastroBlob);
      const urlNegociacao = URL.createObjectURL(pdfNegociacaoBlob);

      const janelaCadastro = window.open(urlCadastro, '_blank');
      setTimeout(() => {
        const janelaNegociacao = window.open(urlNegociacao, '_blank');
        
        // Tentar imprimir automaticamente
        setTimeout(() => {
          try {
            janelaCadastro?.print();
            setTimeout(() => janelaNegociacao?.print(), 1000);
          } catch (error) {
            console.warn('Impressão automática falhou:', error);
          }
        }, 2000);
      }, 500);

      setMensagem('PDFs abertos para impressão!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao gerar PDFs:', error);
      setMensagem('Erro ao gerar PDFs para impressão.');
    }
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'aceita':
        return <Badge variant="default">Aceita</Badge>;
      case 'finalizada':
        return <Badge variant="outline">Finalizada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!usuario) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🏖️ Dashboard Administrativo
              </h1>
              <p className="text-gray-600">
                Bem-vindo, {usuario.nome} | Sessão ativa desde {formatarData(usuario.loginTime)}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>

        {mensagem && (
          <Alert className="mb-6">
            <AlertDescription>{mensagem}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fichas Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Fichas Pendentes
                <Badge variant="destructive">{fichasPendentes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fichasPendentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma ficha pendente no momento
                </p>
              ) : (
                <div className="space-y-4">
                  {fichasPendentes.map((ficha) => (
                    <div key={ficha.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{ficha.dadosCliente.nome}</h3>
                          <p className="text-sm text-gray-600">
                            Consultor: {ficha.consultorNome}
                          </p>
                          <p className="text-sm text-gray-500">
                            Enviado: {formatarData(ficha.dataEnvio)}
                          </p>
                        </div>
                        {getStatusBadge(ficha.status)}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => visualizarFicha(ficha)}
                          variant="outline"
                        >
                          👁️ Visualizar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => imprimirFicha(ficha)}
                          variant="outline"
                        >
                          🖨️ Imprimir
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => aceitarFicha(ficha.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ✅ Aceitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minhas Fichas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📁 Minhas Fichas
                <Badge>{fichasDoAdmin.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fichasDoAdmin.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Você ainda não aceitou nenhuma ficha
                </p>
              ) : (
                <div className="space-y-4">
                  {fichasDoAdmin.map((ficha) => (
                    <div key={ficha.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{ficha.dadosCliente.nome}</h3>
                          <p className="text-sm text-gray-600">
                            Consultor: {ficha.consultorNome}
                          </p>
                          <p className="text-sm text-gray-500">
                            Aceita: {ficha.dataAceitacao && formatarData(ficha.dataAceitacao)}
                          </p>
                        </div>
                        {getStatusBadge(ficha.status)}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => visualizarFicha(ficha)}
                          variant="outline"
                        >
                          👁️ Visualizar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => imprimirFicha(ficha)}
                          variant="outline"
                        >
                          🖨️ Imprimir
                        </Button>
                        {ficha.status === 'aceita' && (
                          <Button
                            size="sm"
                            onClick={() => finalizarAtendimento(ficha.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            🔚 Encerrar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Visualização */}
        {fichaVizualizada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Detalhes da Ficha</CardTitle>
                  <Button variant="outline" onClick={() => setFichaVizualizada(null)}>
                    ✕ Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dados do Cliente */}
                  <div>
                    <h3 className="font-semibold mb-3">👤 Dados do Cliente</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nome:</strong> {fichaVizualizada.dadosCliente.nome}</p>
                      <p><strong>CPF:</strong> {fichaVizualizada.dadosCliente.cpf}</p>
                      <p><strong>Email:</strong> {fichaVizualizada.dadosCliente.email}</p>
                      <p><strong>Telefone:</strong> {fichaVizualizada.dadosCliente.telefone}</p>
                    </div>
                  </div>

                  {/* Dados da Negociação */}
                  <div>
                    <h3 className="font-semibold mb-3">🤝 Dados da Negociação</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Liner:</strong> {fichaVizualizada.dadosNegociacao.liner}</p>
                      <p><strong>Closer:</strong> {fichaVizualizada.dadosNegociacao.closer}</p>
                      <p><strong>Tipo de Venda:</strong> {fichaVizualizada.dadosNegociacao.tipoVenda}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Informações do Sistema */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-3">📊 Informações do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Consultor:</strong> {fichaVizualizada.consultorNome}</p>
                      <p><strong>Data de Envio:</strong> {formatarData(fichaVizualizada.dataEnvio)}</p>
                    </div>
                    <div>
                      <p><strong>Status:</strong> {fichaVizualizada.status}</p>
                      {fichaVizualizada.dataAceitacao && (
                        <p><strong>Aceita em:</strong> {formatarData(fichaVizualizada.dataAceitacao)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
