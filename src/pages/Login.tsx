import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthService from '@/lib/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const resultado = AuthService.login(email, senha);
      
      if (resultado.success && resultado.usuario) {
        // Redirecionar baseado no tipo de usuário
        if (resultado.usuario.tipo === 'admin') {
          navigate('/dashboard-admin');
        } else {
          navigate('/dashboard-consultor');
        }
      } else {
        setErro(resultado.message);
      }
    } catch (error) {
      setErro('Erro interno. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const preencherCredenciais = (tipo: 'admin' | 'consultor') => {
    if (tipo === 'admin') {
      setEmail('admin1@gav.com');
    } else {
      setEmail('consultor1@gav.com');
    }
    setSenha('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              GAV
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            🏖️ GAV Resorts
          </CardTitle>
          <p className="text-gray-600">Sistema de Gestão de Fichas</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                required
                className="mt-1"
              />
            </div>

            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">Acesso rápido para teste:</p>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => preencherCredenciais('admin')}
                className="w-full"
              >
                👨‍💼 Login como Admin
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => preencherCredenciais('consultor')}
                className="w-full"
              >
                👥 Login como Consultor
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Senha padrão: 123456
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
