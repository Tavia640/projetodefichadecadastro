import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FichaStorageService, FichaCompleta } from '@/lib/fichaStorageService';
import { SessionService } from '@/lib/sessionService';
import { PDFGenerator } from '@/lib/pdfGenerator';
import { PDFGeneratorOfficial } from '@/lib/pdfGeneratorOfficial';
import FichaVisualizationModal from '@/components/FichaVisualizationModal';
import { Printer, Eye, Clock, User, FileText, LogOut, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<any>({});
  const [session, setSession] = useState(SessionService.getSession());
  const [fichaVisualizacao, setFichaVisualizacao] = useState<FichaCompleta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const carregarFichas = () => {
    setLoading(true);
    try {
      const fichasData = FichaStorageService.getFichas();
      const stats = FichaStorageService.getEstatisticas();
      
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
    FichaStorageService.atualizarStatus(ficha.id, 'visualizada');
    carregarFichas();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFichaVisualizacao(null);
  };

  const handleImprimirFicha = (ficha: FichaCompleta) => {
    try {
      console.log('🖨️ Gerando PDFs oficiais para impressão...');

      // Gerar PDFs no formato oficial
      const pdfCadastroBlob = PDFGeneratorOfficial.gerarPDFCadastroOficial(ficha.dadosCliente);
      const pdfNegociacaoBlob = PDFGeneratorOfficial.gerarPDFNegociacaoOficial(ficha.dadosCliente, ficha.dadosNegociacao);
      
      // Criar URLs para os blobs
      const urlCadastro = URL.createObjectURL(pdfCadastroBlob);
      const urlNegociacao = URL.createObjectURL(pdfNegociacaoBlob);
      
      // Abrir PDFs em novas janelas para impressão
      const janelaCadastro = window.open(urlCadastro, '_blank');
      const janelaNegociacao = window.open(urlNegociacao, '_blank');
      
      // Aguardar carregamento e imprimir
      setTimeout(() => {
        if (janelaCadastro) {
          janelaCadastro.print();
        }
        if (janelaNegociacao) {
          janelaNegociacao.print();
        }
        
        // Limpar URLs após uso
        setTimeout(() => {
          URL.revokeObjectURL(urlCadastro);
          URL.revokeObjectURL(urlNegociacao);
        }, 5000);
      }, 1500);

      // Atualizar status para impressa
      FichaStorageService.atualizarStatus(ficha.id, 'impressa');
      carregarFichas();
      
      console.log('✅ PDFs enviados para impressão!');
    } catch (error: any) {
      console.error('❌ Erro na impressão:', error);
      alert(`❌ Erro ao gerar PDFs para impressão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleLogout = () => {
    SessionService.clearSession();
    navigate('/login');
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'visualizada': return 'bg-blue-100 text-blue-800';
      case 'impressa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'visualizada': return 'Visualizada';
      case 'impressa': return 'Impressa';
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total || 0}</p>
                  <p className="text-gray-600">Total de Fichas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.pendentes || 0}</p>
                  <p className="text-gray-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.visualizadas || 0}</p>
                  <p className="text-gray-600">Visualizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Printer className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.impressas || 0}</p>
                  <p className="text-gray-600">Impressas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Fichas de Negociação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ficha encontrada</h3>
                <p className="text-gray-500">As fichas preenchidas pelos consultores aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fichas.map((ficha, index) => (
                  <div key={ficha.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {ficha.dadosCliente.nome}
                          </h3>
                          <Badge className={getStatusColor(ficha.status)}>
                            {getStatusText(ficha.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Consultor: {ficha.nomeConsultor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Data: {formatarData(ficha.timestamp)}</span>
                          </div>
                          <div>
                            <span>CPF: {ficha.dadosCliente.cpf}</span>
                          </div>
                        </div>

                        {ficha.dadosNegociacao.contratos.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span>Empreendimento: {ficha.dadosNegociacao.contratos[0].empreendimento}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisualizarFicha(ficha)}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Visualizar</span>
                        </Button>
                        
                        <Button
                          variant="default"
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
