import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FichaSupabaseService, FichaCompleta } from '@/lib/fichaSupabaseService';
import { SessionService } from '@/lib/sessionService';
import { PDFGenerator } from '@/lib/pdfGenerator';
import { PDFGeneratorOfficial } from '@/lib/pdfGeneratorOfficial';
import FichaVisualizationModal from '@/components/FichaVisualizationModal';
import { Printer, Eye, Clock, User, FileText, LogOut, RefreshCw, PlayCircle, CheckCircle, XCircle, Archive, ArchiveRestore } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<any>({});
  const [session, setSession] = useState(SessionService.getSession());
  const [fichaVisualizacao, setFichaVisualizacao] = useState<FichaCompleta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');

  useEffect(() => {
    // Verificar se é admin
    const currentSession = SessionService.getSession();
    if (!currentSession || currentSession.perfil !== 'admin') {
      navigate('/login');
      return;
    }

    setSession(currentSession);
    carregarFichas();
  }, [navigate]);

  const carregarFichas = async () => {
    setLoading(true);
    try {
      const fichasData = await FichaSupabaseService.getFichas();
      const stats = await FichaSupabaseService.getEstatisticas();
      
      setFichas(fichasData);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar fichas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarFicha = (ficha: FichaCompleta) => {
    setFichaVisualizacao(ficha);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFichaVisualizacao(null);
  };

  const handlePegarParaFazer = async (ficha: FichaCompleta) => {
    if (!session) return;

    const sucesso = await FichaSupabaseService.pegarFichaParaFazer(ficha.id, session.nome);
    if (sucesso) {
      carregarFichas();
      alert(`✅ Ficha atribuída com sucesso! Você agora é responsável pelo atendimento de ${ficha.dados_cliente.nome}.`);
    } else {
      alert('❌ Não foi possível pegar esta ficha. Ela pode já estar sendo atendida por outro administrador.');
    }
  };

  const handleEncerrarAtendimento = async (ficha: FichaCompleta) => {
    if (!session) {
      alert('❌ Erro: Sessão não encontrada');
      return;
    }

    const confirmar = window.confirm(`Tem certeza que deseja encerrar o atendimento da ficha de ${ficha.dados_cliente.nome}?`);
    if (!confirmar) return;

    const sucesso = await FichaSupabaseService.encerrarAtendimento(ficha.id, session.nome);
    if (sucesso) {
      carregarFichas();
      alert(`✅ Atendimento encerrado com sucesso!`);
    } else {
      alert(`❌ Não foi possível encerrar o atendimento.`);
    }
  };

  const handleLiberarFicha = async (ficha: FichaCompleta) => {
    if (!session) return;

    const confirmar = window.confirm(`Tem certeza que deseja liberar a ficha de ${ficha.dados_cliente.nome}? Ela voltará para a lista de fichas pendentes.`);
    if (!confirmar) return;

    const sucesso = await FichaSupabaseService.liberarFicha(ficha.id, session.nome);
    if (sucesso) {
      carregarFichas();
      alert(`✅ Ficha liberada com sucesso!`);
    } else {
      alert('❌ Não foi possível liberar a ficha.');
    }
  };

  const handleArquivarFicha = async (ficha: FichaCompleta) => {
    if (!session) return;

    const confirmar = window.confirm(`Tem certeza que deseja arquivar a ficha de ${ficha.dados_cliente.nome}?`);
    if (!confirmar) return;

    const sucesso = await FichaSupabaseService.arquivarFicha(ficha.id, session.nome);
    if (sucesso) {
      carregarFichas();
      alert(`📁 Ficha arquivada com sucesso!`);
    } else {
      alert('❌ Não foi possível arquivar a ficha. Só é possível arquivar fichas concluídas.');
    }
  };

  const handleDesarquivarFicha = async (ficha: FichaCompleta) => {
    if (!session) return;

    const confirmar = window.confirm(`Tem certeza que deseja desarquivar a ficha de ${ficha.dados_cliente.nome}?`);
    if (!confirmar) return;

    const sucesso = await FichaSupabaseService.desarquivarFicha(ficha.id, session.nome);
    if (sucesso) {
      carregarFichas();
      alert(`📂 Ficha desarquivada com sucesso!`);
    } else {
      alert('❌ Não foi possível desarquivar a ficha.');
    }
  };

  const getFichasFiltradas = () => {
    if (filtroStatus === 'todas') return fichas;
    if (filtroStatus === 'minhas') return fichas.filter(f => f.nome_admin === session?.nome);
    return fichas.filter(f => f.status === filtroStatus);
  };

  const handleImprimirFicha = (ficha: FichaCompleta) => {
    try {
      console.log('🖨️ Iniciando geração dos PDFs oficiais...');
      console.log('📋 Dados da ficha:', ficha);

      // Gerar PDF de Cadastro
      console.log('📄 Gerando PDF de Cadastro...');
      const pdfCadastroBlob = PDFGeneratorOfficial.gerarPDFCadastroOficial(ficha.dados_cliente, ficha.dados_negociacao);
      console.log('✅ PDF de Cadastro gerado com sucesso', pdfCadastroBlob.size, 'bytes');

      // Gerar PDF de Negociação
      console.log('📄 Gerando PDF de Negociação...');
      const pdfNegociacaoBlob = PDFGeneratorOfficial.gerarPDFNegociacaoOficial(ficha.dados_cliente, ficha.dados_negociacao);
      console.log('✅ PDF de Negociação gerado com sucesso', pdfNegociacaoBlob.size, 'bytes');

      // Verificar se os blobs foram criados corretamente
      if (!pdfCadastroBlob || pdfCadastroBlob.size === 0) {
        throw new Error('Falha na geração do PDF de Cadastro');
      }
      if (!pdfNegociacaoBlob || pdfNegociacaoBlob.size === 0) {
        throw new Error('Falha na geração do PDF de Negociação');
      }

      // Criar URLs para os blobs
      const urlCadastro = URL.createObjectURL(pdfCadastroBlob);
      const urlNegociacao = URL.createObjectURL(pdfNegociacaoBlob);
      console.log('🔗 URLs criadas para os PDFs');

      // Função para baixar PDF com nome específico
      const baixarPDF = (blob: Blob, nomeArquivo: string) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      };

      // Gerar nomes dos arquivos baseado no cliente
      const nomeCliente = ficha.dados_cliente.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente';
      const timestamp = new Date().toISOString().slice(0, 10);

      // Baixar ambos os PDFs
      baixarPDF(pdfCadastroBlob, `Cadastro_${nomeCliente}_${timestamp}.pdf`);
      baixarPDF(pdfNegociacaoBlob, `Negociacao_${nomeCliente}_${timestamp}.pdf`);

      // Também abrir em novas janelas para visualização/impressão
      setTimeout(() => {
        console.log('🖨️ Abrindo PDFs em novas janelas...');
        const janelaCadastro = window.open(urlCadastro, '_blank');
        const janelaNegociacao = window.open(urlNegociacao, '_blank');

        // Aguardar carregamento e preparar para impressão
        setTimeout(() => {
          if (janelaCadastro) {
            janelaCadastro.print();
            console.log('🖨️ PDF de Cadastro enviado para impressão');
          }
          if (janelaNegociacao) {
            janelaNegociacao.print();
            console.log('🖨️ PDF de Negociação enviado para impressão');
          }
        }, 1000);

        // Limpar URLs após uso
        setTimeout(() => {
          URL.revokeObjectURL(urlCadastro);
          URL.revokeObjectURL(urlNegociacao);
        }, 10000);
      }, 500);

      console.log('✅ Processo de impressão completo - 2 PDFs gerados!');
      alert('✅ 2 PDFs foram gerados e baixados: Cadastro e Negociação');

    } catch (error: any) {
      console.error('❌ Erro na impressão:', error);
      console.error('📊 Stack trace:', error.stack);
      console.error('📋 Dados da ficha no erro:', ficha);

      let mensagemErro = 'Erro desconhecido';
      if (error.message) {
        mensagemErro = error.message;
      } else if (typeof error === 'string') {
        mensagemErro = error;
      }

      alert(`❌ Erro ao gerar PDFs para impressão:\n\n${mensagemErro}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleLogout = () => {
    SessionService.clearSession();
    navigate('/login');
  };

  const formatarData = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento': return 'bg-orange-100 text-orange-800';
      case 'concluida': return 'bg-green-100 text-green-800';
      case 'arquivada': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'arquivada': return 'Arquivada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando fichas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">GAV</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard Administrativo</h1>
                  <p className="text-sm text-gray-500">Fichas de Negociação</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">👋 {session?.nome}</p>
                <p className="text-xs text-gray-500">Sessão expira em: {SessionService.getRemainingTime()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={carregarFichas}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">{estatisticas.total || 0}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">{estatisticas.pendentes || 0}</p>
                  <p className="text-xs text-gray-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <PlayCircle className="h-6 w-6 text-orange-600" />
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">{estatisticas.em_andamento || 0}</p>
                  <p className="text-xs text-gray-600">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">{estatisticas.concluidas || 0}</p>
                  <p className="text-xs text-gray-600">Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Archive className="h-6 w-6 text-gray-600" />
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">{estatisticas.arquivadas || 0}</p>
                  <p className="text-xs text-gray-600">Arquivadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Fichas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Fichas de Negociação</span>
              </CardTitle>

              {/* Filtro de Status */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filtrar por:</span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todas">Todas</option>
                  <option value="pendente">Pendentes</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluídas</option>
                  <option value="arquivada">Arquivadas</option>
                  <option value="minhas">Minhas Fichas</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {getFichasFiltradas().length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ficha encontrada</h3>
                <p className="text-gray-500">
                  {filtroStatus === 'todas'
                    ? 'As fichas preenchidas pelos consultores aparecerão aqui.'
                    : filtroStatus === 'minhas'
                    ? 'Você não possui fichas atribuídas no momento.'
                    : `Nenhuma ficha com status "${getStatusText(filtroStatus)}" encontrada.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFichasFiltradas().map((ficha, index) => (
                  <div key={ficha.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {ficha.dados_cliente.nome}
                          </h3>
                          <Badge className={getStatusColor(ficha.status)}>
                            {getStatusText(ficha.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Consultor: {ficha.nome_consultor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Data: {formatarData(ficha.created_at)}</span>
                          </div>
                          <div>
                            <span>CPF: {ficha.dados_cliente.cpf}</span>
                          </div>
                        </div>

                        {/* Informações do Admin Responsável */}
                        {ficha.nome_admin && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-medium text-blue-800">
                              📋 Admin Responsável: {ficha.nome_admin}
                            </span>
                          </div>
                        )}

                        {ficha.dados_negociacao.contratos && ficha.dados_negociacao.contratos.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span>Empreendimento: {ficha.dados_negociacao.contratos[0].empreendimento}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        {/* Botão Visualizar - sempre disponível */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisualizarFicha(ficha)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Visualizar</span>
                        </Button>

                        {/* Botões baseados no status da ficha */}
                        {ficha.status === 'pendente' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePegarParaFazer(ficha)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <PlayCircle className="h-4 w-4" />
                            <span>Pegar para Fazer</span>
                          </Button>
                        )}

                        {ficha.status === 'em_andamento' && ficha.nome_admin && session?.nome &&
                         ficha.nome_admin === session.nome && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEncerrarAtendimento(ficha)}
                              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Encerrar Atendimento</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLiberarFicha(ficha)}
                              className="flex items-center space-x-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Liberar</span>
                            </Button>
                          </>
                        )}

                        {ficha.status === 'em_andamento' && ficha.nome_admin && session?.nome &&
                         ficha.nome_admin !== session.nome && (
                          <div className="text-xs text-gray-500 italic">
                            Em atendimento por {ficha.nome_admin}
                          </div>
                        )}

                        {/* Botão Arquivar - para fichas concluídas */}
                        {ficha.status === 'concluida' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArquivarFicha(ficha)}
                            className="flex items-center space-x-2 text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            <Archive className="h-4 w-4" />
                            <span>Arquivar</span>
                          </Button>
                        )}

                        {/* Botão Desarquivar - para fichas arquivadas */}
                        {ficha.status === 'arquivada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesarquivarFicha(ficha)}
                            className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                            <span>Desarquivar</span>
                          </Button>
                        )}

                        {/* Botão Imprimir - sempre disponível */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImprimirFicha(ficha)}
                          className="flex items-center space-x-2"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Imprimir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Visualização */}
      <FichaVisualizationModal
        ficha={fichaVisualizacao}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AdminDashboard;