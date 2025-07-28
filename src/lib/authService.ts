export interface Usuario {
  id: string;
  nome: string;
  tipo: 'admin' | 'consultor';
  dataLogin: Date;
}

export class AuthService {
  private static readonly STORAGE_KEY = 'usuario_logado';
  private static readonly SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 horas em millisegundos

  static login(nome: string, tipo: 'admin' | 'consultor'): Usuario {
    const usuario: Usuario = {
      id: Date.now().toString(),
      nome: nome.trim(),
      tipo,
      dataLogin: new Date()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuario));
    return usuario;
  }

  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('fichas_enviadas');
    localStorage.removeItem('fichas_aceitas');
  }

  static getUsuarioLogado(): Usuario | null {
    try {
      const usuarioString = localStorage.getItem(this.STORAGE_KEY);
      if (!usuarioString) return null;

      const usuario: Usuario = JSON.parse(usuarioString);
      
      // Verificar se a sessão expirou (12 horas)
      const agora = new Date().getTime();
      const dataLogin = new Date(usuario.dataLogin).getTime();
      const tempoDecorrido = agora - dataLogin;

      if (tempoDecorrido > this.SESSION_DURATION) {
        this.logout();
        return null;
      }

      return usuario;
    } catch (error) {
      console.error('Erro ao recuperar usuário logado:', error);
      this.logout();
      return null;
    }
  }

  static isLogado(): boolean {
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

  static getNomeUsuario(): string {
    const usuario = this.getUsuarioLogado();
    return usuario?.nome || '';
  }
}
