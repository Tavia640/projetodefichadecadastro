import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthService, { FichaEnviada, Usuario } from '@/lib/auth';

const DashboardConsultor: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fichasEnviadas, setFichasEnviadas] = useState<FichaEnviada[]>([]);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const usuarioLogado = AuthService.getUsuarioLogado();
    if (!usuarioLogado || usuarioLogado.tipo !== 'consultor') {
      navigate('/login');
      return;
    }
    
    setUsuario(usuarioLogado);
    carregarFichas();
  }, [navigate]);

  const carregarFichas = () => {
    if (usuario) {
      const todasFichas = AuthService.getFichas();
      const minhasFichas = todasFichas.filter(ficha => ficha.consultorId === usuario.id);
      setFichasEnviadas(minhasFichas);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const iniciarNovaFicha = () => {
    navigate('/cadastro-cliente');
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Aguardando Admin</Badge>;
      case 'aceita':
        return <Badge variant="default">Em Atendimento</Badge>;
      case 'finalizada':
        return <Badge className="bg-green-600">Finalizada</Badge>;
      case 'arquivada':
        return <Badge variant="outline">Arquivada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return '⏳';
      case 'aceita':
        return '👨‍💼';
      case 'finalizada':
        return '✅';
      case 'arquivada':
        return '📦';
      default:
        return '📋';
    }
  };

  if (!usuario) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🏖️ Dashboard do Consultor
              </h1>
              <p className="text-gray-600">
                Bem-vindo, {usuario.nome} | Sessão ativa desde {formatarData(usuario.loginTime)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={iniciarNovaFicha} className="bg-green-600 hover:bg-green-700">
                ➕ Nova Ficha
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>

        {mensagem && (
          <Alert className="mb-6">
            <AlertDescription>{mensagem}</AlertDescription>
          </Alert>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {fichasEnviadas.length}
              </div>
              <p className="text-sm text-gray-600">Total de Fichas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {fichasEnviadas.filter(f => f.status === 'pendente').length}
              </div>
              <p className="text-sm text-gray-600">Aguardando</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {fichasEnviadas.filter(f => f.status === 'aceita').length}
              </div>
              <p className="text-sm text-gray-600">Em Atendimento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {fichasEnviadas.filter(f => f.status === 'finalizada').length}
              </div>
              <p className="text-sm text-gray-600">Finalizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Minhas Fichas Enviadas
              <Badge>{fichasEnviadas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichasEnviadas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-500 mb-4">
                  Você ainda não enviou nenhuma ficha
                </p>
                <Button onClick={iniciarNovaFicha} className="bg-green-600 hover:bg-green-700">
                  ➕ Criar Primeira Ficha
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fichasEnviadas
                  .sort((a, b) => b.dataEnvio - a.dataEnvio)
                  .map((ficha) => (
                    <div key={ficha.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getStatusIcon(ficha.status)}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{ficha.dadosCliente.nome}</h3>
                              <p className="text-sm text-gray-600">
                                CPF: {ficha.dadosCliente.cpf}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">📧 Email</p>
                              <p className="font-medium">{ficha.dadosCliente.email || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">📞 Telefone</p>
                              <p className="font-medium">{ficha.dadosCliente.telefone || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">💼 Tipo de Venda</p>
                              <p className="font-medium">{ficha.dadosNegociacao.tipoVenda || 'Não informado'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(ficha.status)}
                          <p className="text-xs text-gray-500">
                            {formatarData(ficha.dataEnvio)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Informações de Status Detalhadas */}
                      {ficha.status === 'aceita' && ficha.adminNome && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm">
                            <strong>👨‍💼 Atendimento iniciado por:</strong> {ficha.adminNome}
                          </p>
                          {ficha.dataAceitacao && (
                            <p className="text-xs text-gray-600">
                              Aceita em: {formatarData(ficha.dataAceitacao)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {ficha.status === 'finalizada' && (
                        <div className="mt-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
                          <p className="text-sm">
                            <strong>✅ Atendimento finalizado por:</strong> {ficha.adminNome}
                          </p>
                          {ficha.dataFinalizacao && (
                            <p className="text-xs text-gray-600">
                              Finalizada em: {formatarData(ficha.dataFinalizacao)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {ficha.status === 'arquivada' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                          <p className="text-sm">
                            <strong>📦 Ficha arquivada automaticamente</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardConsultor;
