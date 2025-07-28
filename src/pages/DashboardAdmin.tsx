import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/lib/authService';
import { FichaService, Ficha } from '@/lib/fichaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Eye, Check, Archive, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PDFGenerator } from '@/lib/pdfGenerator';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [fichasPendentes, setFichasPendentes] = useState<Ficha[]>([]);
  const [fichasAceitas, setFichasAceitas] = useState<Ficha[]>([]);

  useEffect(() => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'admin') {
      navigate('/login');
      return;
    }

    carregarFichas();
    
    // Limpar fichas arquivadas automaticamente
    FichaService.limparFichasArquivadas();
  }, [navigate]);

  const carregarFichas = () => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario) return;

    const pendentes = FichaService.getFichasPendentes();
    const aceitas = FichaService.getFichasDoAdmin(usuario.nome);
    
    setFichasPendentes(pendentes);
    setFichasAceitas(aceitas.filter(f => f.status === 'aceita'));
  };

  const handleLogout = () => {
    AuthService.logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const handleAceitarFicha = (fichaId: string) => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario) return;

    const sucesso = FichaService.aceitarFicha(fichaId, usuario.nome);
    if (sucesso) {
      toast.success('Ficha aceita com sucesso!');
      carregarFichas();
    } else {
      toast.error('Erro ao aceitar ficha');
    }
  };

  const handleArquivarFicha = (fichaId: string) => {
    const sucesso = FichaService.arquivarFicha(fichaId);
    if (sucesso) {
      toast.success('Atendimento encerrado e ficha arquivada!');
      carregarFichas();
    } else {
      toast.error('Erro ao arquivar ficha');
    }
  };

  const handleVisualizarFicha = (ficha: Ficha) => {
    localStorage.setItem('ficha_visualizar', JSON.stringify(ficha));
    navigate('/visualizar-ficha');
  };

  const handleImprimirFicha = (ficha: Ficha) => {
    try {
      console.log('🖨️ Iniciando impressão da ficha...');
      
      // Gerar PDFs como blob URLs para impressão
      const pdfCadastroBlob = PDFGenerator.gerarPDFCadastroClienteBlob(ficha.dadosCliente);
      const pdfNegociacaoBlob = PDFGenerator.gerarPDFNegociacaoBlob(ficha.dadosCliente, ficha.dadosNegociacao);
      
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
      
      toast.success('PDFs abertos para impressão!');
      
    } catch (error: any) {
      console.error('❌ Erro na impressão:', error);
      toast.error(`Erro ao gerar PDFs para impressão: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const usuario = AuthService.getUsuarioLogado();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Bem-vindo, {usuario?.nome}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Fichas Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Fichas Pendentes
              <Badge variant="secondary">{fichasPendentes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichasPendentes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma ficha pendente no momento
              </p>
            ) : (
              <div className="space-y-4">
                {fichasPendentes.map((ficha) => (
                  <div key={ficha.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{ficha.dadosCliente.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Consultor: {ficha.consultor} | 
                          Enviado em: {ficha.dataEnvio.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline">Pendente</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVisualizarFicha(ficha)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAceitarFicha(ficha.id)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImprimirFicha(ficha)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minhas Fichas Aceitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minhas Fichas Aceitas
              <Badge variant="secondary">{fichasAceitas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichasAceitas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não aceitou nenhuma ficha
              </p>
            ) : (
              <div className="space-y-4">
                {fichasAceitas.map((ficha) => (
                  <div key={ficha.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{ficha.dadosCliente.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Consultor: {ficha.consultor} | 
                          Aceita em: {ficha.dataAceite?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="default">Aceita</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVisualizarFicha(ficha)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImprimirFicha(ficha)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleArquivarFicha(ficha.id)}
                        className="flex items-center gap-1"
                      >
                        <Archive className="h-4 w-4" />
                        Encerrar Atendimento
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da sessão */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              <p>Tipo de usuário: <span className="font-medium">Administrador</span></p>
              <p>Sessão válida até: <span className="font-medium">
                {usuario?.dataLogin && new Date(new Date(usuario.dataLogin).getTime() + 12 * 60 * 60 * 1000).toLocaleString('pt-BR')}
              </span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmin;
