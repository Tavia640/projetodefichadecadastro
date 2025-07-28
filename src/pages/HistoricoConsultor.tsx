import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/lib/authService';
import { FichaService, Ficha } from '@/lib/fichaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, FileText } from 'lucide-react';

const HistoricoConsultor = () => {
  const navigate = useNavigate();
  const [fichasEnviadas, setFichasEnviadas] = useState<Ficha[]>([]);

  useEffect(() => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'consultor') {
      navigate('/login');
      return;
    }

    carregarFichas();
  }, [navigate]);

  const carregarFichas = () => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario) return;

    const todasFichas = FichaService.getFichas();
    const fichasDoConsultor = todasFichas.filter(f => f.consultor === usuario.nome);
    setFichasEnviadas(fichasDoConsultor);
  };

  const handleVisualizarFicha = (ficha: Ficha) => {
    localStorage.setItem('ficha_visualizar', JSON.stringify(ficha));
    navigate('/visualizar-ficha');
  };

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

  const usuario = AuthService.getUsuarioLogado();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/area-consultor')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Histórico de Fichas</h1>
        </div>

        {/* Lista de Fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Minhas Fichas Enviadas
              <Badge variant="secondary">{fichasEnviadas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichasEnviadas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Você ainda não enviou nenhuma ficha
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/cadastro-cliente')}
                >
                  Enviar Primeira Ficha
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fichasEnviadas.map((ficha) => (
                  <div key={ficha.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{ficha.dadosCliente.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Enviado em: {ficha.dataEnvio.toLocaleString('pt-BR')}
                          {ficha.adminResponsavel && (
                            <> | Admin: {ficha.adminResponsavel}</>
                          )}
                          {ficha.dataAceite && (
                            <> | Aceita em: {ficha.dataAceite.toLocaleString('pt-BR')}</>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          CPF: {ficha.dadosCliente.cpf} | Email: {ficha.dadosCliente.email}
                        </p>
                      </div>
                      {getStatusBadge(ficha.status)}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {fichasEnviadas.filter(f => f.status === 'pendente').length}
                </div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {fichasEnviadas.filter(f => f.status === 'aceita').length}
                </div>
                <p className="text-sm text-muted-foreground">Aceitas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {fichasEnviadas.filter(f => f.status === 'arquivada').length}
                </div>
                <p className="text-sm text-muted-foreground">Arquivadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HistoricoConsultor;
