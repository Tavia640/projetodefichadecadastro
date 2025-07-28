import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/authService';
import { toast } from 'sonner';
import { User, Shield } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (tipo: 'admin' | 'consultor') => {
    if (!nome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    setIsLoading(true);
    
    try {
      const usuario = AuthService.login(nome.trim(), tipo);
      
      toast.success(`Bem-vindo, ${usuario.nome}!`);
      
      // Redirecionar baseado no tipo de usuário
      if (tipo === 'admin') {
        navigate('/dashboard-admin');
      } else {
        navigate('/cadastro-cliente');
      }
    } catch (error) {
      toast.error('Erro ao fazer login. Tente novamente.');
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Sistema GAV</h1>
          <p className="text-muted-foreground mt-2">Faça login para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Seu nome:</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nome.trim()) {
                    handleLogin('consultor');
                  }
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Escolha seu tipo de acesso:
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleLogin('consultor')}
                  disabled={!nome.trim() || isLoading}
                  className="h-12 flex items-center justify-center gap-3"
                  variant="default"
                >
                  <User className="h-5 w-5" />
                  Acessar como Consultor
                </Button>

                <Button
                  onClick={() => handleLogin('admin')}
                  disabled={!nome.trim() || isLoading}
                  className="h-12 flex items-center justify-center gap-3"
                  variant="secondary"
                >
                  <Shield className="h-5 w-5" />
                  Acessar como Administrador
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <p>Sessão válida por 12 horas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
