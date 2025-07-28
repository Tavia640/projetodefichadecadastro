export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'consultor';
  loginTime: number;
}

export interface FichaEnviada {
  id: string;
  consultorId: string;
  consultorNome: string;
  dadosCliente: any;
  dadosNegociacao: any;
  dataEnvio: number;
  status: 'pendente' | 'aceita' | 'finalizada' | 'arquivada';
  adminId?: string;
  adminNome?: string;
  dataAceitacao?: number;
  dataFinalizacao?: number;
}

class AuthService {
  private static readonly SESSION_KEY = 'gav_session';
  private static readonly FICHAS_KEY = 'gav_fichas';
  private static readonly SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 horas

  // Usuários pré-definidos (em produção isso viria de um banco)
  private static usuarios: Usuario[] = [
    { id: '1', nome: 'Admin 1', email: 'admin1@gav.com', tipo: 'admin', loginTime: 0 },
    { id: '2', nome: 'Admin 2', email: 'admin2@gav.com', tipo: 'admin', loginTime: 0 },
    { id: '3', nome: 'Consultor 1', email: 'consultor1@gav.com', tipo: 'consultor', loginTime: 0 },
    { id: '4', nome: 'Consultor 2', email: 'consultor2@gav.com', tipo: 'consultor', loginTime: 0 },
    { id: '5', nome: 'Consultor 3', email: 'consultor3@gav.com', tipo: 'consultor', loginTime: 0 }
  ];

  static login(email: string, senha: string): { success: boolean; usuario?: Usuario; message: string } {
    // Validação simples (em produção seria mais segura)
    const usuario = this.usuarios.find(u => u.email === email);
    
    if (!usuario) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    // Senha padrão simples (em produção seria hash)
    const senhaValida = senha === '123456';
    
    if (!senhaValida) {
      return { success: false, message: 'Senha incorreta' };
    }

    // Criar sessão
    const usuarioLogado: Usuario = {
      ...usuario,
      loginTime: Date.now()
    };

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(usuarioLogado));

    return { 
      success: true, 
      usuario: usuarioLogado, 
      message: 'Login realizado com sucesso' 
    };
  }

  static logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  static getUsuarioLogado(): Usuario | null {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const usuario: Usuario = JSON.parse(sessionData);
      
      // Verificar se a sessão ainda é válida (12 horas)
      const agora = Date.now();
      if (agora - usuario.loginTime > this.SESSION_DURATION) {
        this.logout();
        return null;
      }

      return usuario;
    } catch {
      return null;
    }
  }

  static isLoggedIn(): boolean {
    return this.getUsuarioLogado() !== null;
  }

  static isAdmin(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.tipo === 'admin';
  }

  static isConsultor(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.tipo === 'consultor';
  }

  // Gerenciamento de fichas
  static enviarFicha(dadosCliente: any, dadosNegociacao: any): string {
    const usuario = this.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'consultor') {
      throw new Error('Apenas consultores podem enviar fichas');
    }

    const ficha: FichaEnviada = {
      id: Date.now().toString(),
      consultorId: usuario.id,
      consultorNome: usuario.nome,
      dadosCliente,
      dadosNegociacao,
      dataEnvio: Date.now(),
      status: 'pendente'
    };

    const fichas = this.getFichas();
    fichas.push(ficha);
    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));

    return ficha.id;
  }

  static getFichas(): FichaEnviada[] {
    try {
      const fichasData = localStorage.getItem(this.FICHAS_KEY);
      if (!fichasData) return [];
      
      const fichas: FichaEnviada[] = JSON.parse(fichasData);
      
      // Arquivar fichas antigas (23:59 do dia)
      const agora = new Date();
      const inicioDoProximoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 0);
      
      const fichasAtualizadas = fichas.map(ficha => {
        if (ficha.status === 'finalizada' && ficha.dataFinalizacao) {
          const dataFinalizacao = new Date(ficha.dataFinalizacao);
          const fimDoDiaFinalizacao = new Date(dataFinalizacao.getFullYear(), dataFinalizacao.getMonth(), dataFinalizacao.getDate(), 23, 59, 59);
          
          if (agora > fimDoDiaFinalizacao) {
            return { ...ficha, status: 'arquivada' as const };
          }
        }
        return ficha;
      });

      // Salvar se houve mudanças
      if (JSON.stringify(fichas) !== JSON.stringify(fichasAtualizadas)) {
        localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichasAtualizadas));
      }

      return fichasAtualizadas;
    } catch {
      return [];
    }
  }

  static getFichasPendentes(): FichaEnviada[] {
    return this.getFichas().filter(ficha => ficha.status === 'pendente');
  }

  static getFichasDoAdmin(adminId: string): FichaEnviada[] {
    return this.getFichas().filter(ficha => 
      ficha.adminId === adminId && 
      (ficha.status === 'aceita' || ficha.status === 'finalizada')
    );
  }

  static aceitarFicha(fichaId: string): boolean {
    const usuario = this.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'admin') {
      return false;
    }

    const fichas = this.getFichas();
    const fichaIndex = fichas.findIndex(f => f.id === fichaId && f.status === 'pendente');
    
    if (fichaIndex === -1) {
      return false;
    }

    fichas[fichaIndex] = {
      ...fichas[fichaIndex],
      status: 'aceita',
      adminId: usuario.id,
      adminNome: usuario.nome,
      dataAceitacao: Date.now()
    };

    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
    return true;
  }

  static finalizarAtendimento(fichaId: string): boolean {
    const usuario = this.getUsuarioLogado();
    if (!usuario || usuario.tipo !== 'admin') {
      return false;
    }

    const fichas = this.getFichas();
    const fichaIndex = fichas.findIndex(f => 
      f.id === fichaId && 
      f.adminId === usuario.id && 
      f.status === 'aceita'
    );
    
    if (fichaIndex === -1) {
      return false;
    }

    fichas[fichaIndex] = {
      ...fichas[fichaIndex],
      status: 'finalizada',
      dataFinalizacao: Date.now()
    };

    localStorage.setItem(this.FICHAS_KEY, JSON.stringify(fichas));
    return true;
  }

  static getFicha(fichaId: string): FichaEnviada | null {
    const fichas = this.getFichas();
    return fichas.find(f => f.id === fichaId) || null;
  }

  // Função para limpar dados (desenvolvimento)
  static limparDados(): void {
    localStorage.removeItem(this.FICHAS_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}

export default AuthService;
