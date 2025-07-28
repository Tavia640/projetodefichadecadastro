import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/lib/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, FileText, History } from 'lucide-react';
import { toast } from 'sonner';

const AreaConsultor = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = AuthService.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'consultor') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    AuthService.logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const usuario = AuthService.getUsuarioLogado();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Área do Consultor</h1>
            <p className="text-muted-foreground">Bem-vindo, {usuario?.nome}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Menu de opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/cadastro-cliente')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                Cadastro de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cadastre um novo cliente e inicie o processo de negociação
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/ficha-negociacao')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Ficha de Negociação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Preencha e envie fichas de negociação para os administradores
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/historico-consultor')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <History className="h-6 w-6 text-primary" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualize o histórico de fichas enviadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações da sessão */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              <p>Tipo de usuário: <span className="font-medium">Consultor</span></p>
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

export default AreaConsultor;
