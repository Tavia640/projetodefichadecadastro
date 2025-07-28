import jsPDF from 'jspdf';

export interface DadosCliente {
  nome?: string;
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  estadoEmissor?: string;
  profissao?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numeroResidencia?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
  // Campos do cônjuge
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  estadoEmissorConjuge?: string;
  profissaoConjuge?: string;
  estadoCivilConjuge?: string;
  emailConjuge?: string;
  telefoneConjuge?: string;
  [key: string]: any;
}

export interface DadosNegociacao {
  liner?: string;
  closer?: string;
  tipoVenda?: string;
  parcelasPagasSala: Array<{
    tipo: string;
    valorTotal: string;
    valorDistribuido: string;
    quantidadeCotas: string;
    formasPagamento: string[];
  }>;
  contratos: Array<{
    tipoContrato?: string;
    empreendimento: string;
    torre?: string;
    apartamento?: string;
    cota?: string;
    categoriaPreco?: string;
    valor: string;
    [key: string]: any;
  }>;
  informacoesPagamento: Array<{
    tipo: string;
    total: string;
    qtdParcelas: string;
    valorParcela: string;
    formaPagamento: string;
    primeiroVencimento: string;
  }>;
}

export class PDFGenerator {
  // Função para criar cabeçalho padronizado
  private static createHeader(pdf: jsPDF, titulo: string, pagina: string) {
    // Logo GAV
    pdf.setFillColor(41, 128, 185);
    pdf.rect(15, 15, 40, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("GAV", 30, 25);
    pdf.setFontSize(8);
    pdf.text("RESORTS", 27, 28);

    // Reset cor do texto
    pdf.setTextColor(0, 0, 0);

    // Título central
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(titulo, 105, 20, { align: 'center' });

    // Info lateral direita
    pdf.rect(150, 15, 45, 15);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("FORMULÁRIO", 170, 18, { align: 'center' });
    pdf.text("Código:FOR.02.01.002", 152, 22);
    pdf.text("Rev.: 24/07/2025-Ver.02", 152, 25);
    pdf.text(pagina, 152, 28);
  }

  // Função para criar campos de formulário
  private static createFormField(
    pdf: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number = 6
  ) {
    // Campo
    pdf.rect(x, y, width, height);
    
    // Label
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(label + ":", x + 1, y - 1);
    
    // Valor
    if (value) {
      pdf.setFontSize(9);
      pdf.text(value, x + 1, y + 4);
    }
  }

  // Função para criar seção com título
  private static createSection(pdf: jsPDF, titulo: string, x: number, y: number, width: number) {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x, y, width, 6, 'F');
    pdf.rect(x, y, width, 6);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(titulo, x + 2, y + 4);
    
    return y + 8;
  }

  // Página 1: Cadastro de Cliente
  static gerarPDFCadastroCliente(dadosCliente: DadosCliente): string {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('datauristring');
  }

  static gerarPDFCadastroClienteBlob(dadosCliente: DadosCliente): Blob {
    const pdf = this.createPDFCadastroCliente(dadosCliente);
    return pdf.output('blob');
  }

  private static createPDFCadastroCliente(dadosCliente: DadosCliente): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Cabeçalho
      this.createHeader(pdf, 'Ficha de Cadastro de Cliente', 'Página: 1 de 2');
      
      let yPos = 45;
      
      // DADOS DO CLIENTE
      yPos = this.createSection(pdf, 'DADOS DO CLIENTE:', 15, yPos, 180);
      
      // Nome
      this.createFormField(pdf, 'Nome', dadosCliente.nome || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // CPF
      this.createFormField(pdf, 'CPF', dadosCliente.cpf || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // RG, ÓRGÃO, UF
      this.createFormField(pdf, 'RG', dadosCliente.rg || '', 15, yPos, 100, 8);
      this.createFormField(pdf, 'ÓRGÃO', dadosCliente.orgaoEmissor || '', 120, yPos, 40, 8);
      this.createFormField(pdf, 'UF', dadosCliente.estadoEmissor || '', 165, yPos, 30, 8);
      yPos += 12;
      
      // Profissão
      this.createFormField(pdf, 'Profissão', dadosCliente.profissao || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // Estado Civil
      this.createFormField(pdf, 'Estado Civil', dadosCliente.estadoCivil || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // E-mail
      this.createFormField(pdf, 'E-mail', dadosCliente.email || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // Telefone
      this.createFormField(pdf, 'Telefone', dadosCliente.telefone || '', 15, yPos, 180, 8);
      yPos += 18;
      
      // DADOS DO CÔNJUGE
      yPos = this.createSection(pdf, 'DADOS DO CÔNJUGE:', 15, yPos, 180);
      
      // Nome cônjuge
      this.createFormField(pdf, 'Nome', dadosCliente.nomeConjuge || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // CPF cônjuge
      this.createFormField(pdf, 'CPF', dadosCliente.cpfConjuge || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // RG, ÓRGÃO, UF cônjuge
      this.createFormField(pdf, 'RG', dadosCliente.rgConjuge || '', 15, yPos, 100, 8);
      this.createFormField(pdf, 'ÓRGÃO', dadosCliente.orgaoEmissorConjuge || '', 120, yPos, 40, 8);
      this.createFormField(pdf, 'UF', dadosCliente.estadoEmissorConjuge || '', 165, yPos, 30, 8);
      yPos += 12;
      
      // Profissão cônjuge
      this.createFormField(pdf, 'Profissão', dadosCliente.profissaoConjuge || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // Estado Civil cônjuge
      this.createFormField(pdf, 'Estado Civil', dadosCliente.estadoCivilConjuge || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // E-mail cônjuge
      this.createFormField(pdf, 'E-mail', dadosCliente.emailConjuge || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // Telefone cônjuge
      this.createFormField(pdf, 'Telefone', dadosCliente.telefoneConjuge || '', 15, yPos, 180, 8);
      yPos += 18;
      
      // ENDEREÇO
      yPos = this.createSection(pdf, 'ENDEREÇO:', 15, yPos, 180);
      
      // Logradouro e Nº
      this.createFormField(pdf, 'Logradouro', dadosCliente.endereco || '', 15, yPos, 130, 8);
      this.createFormField(pdf, 'Nº', dadosCliente.numeroResidencia || '', 150, yPos, 45, 8);
      yPos += 12;
      
      // Bairro
      this.createFormField(pdf, 'Bairro', dadosCliente.bairro || '', 15, yPos, 180, 8);
      yPos += 12;
      
      // Complemento e CEP
      this.createFormField(pdf, 'Complemento', dadosCliente.complemento || '', 15, yPos, 100, 8);
      this.createFormField(pdf, 'CEP', dadosCliente.cep || '', 120, yPos, 75, 8);
      yPos += 12;
      
      // Cidade e UF
      this.createFormField(pdf, 'Cidade', dadosCliente.cidade || '', 15, yPos, 130, 8);
      this.createFormField(pdf, 'UF', dadosCliente.estado || '', 150, yPos, 45, 8);
      yPos += 20;
      
      // SALA DE VENDAS
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text('SALA DE VENDAS:', 15, yPos);
      
      // Checkbox BEEBACK
      pdf.rect(130, yPos - 4, 3, 3);
      pdf.text('☑', 131, yPos - 1);
      pdf.text('BEEBACK', 140, yPos);
      yPos += 12;
      
      // LINER
      pdf.text('LINER: ________________________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // EMPRESA (Liner)
      pdf.text('EMPRESA (Liner): _______________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // CLOSER
      pdf.text('CLOSER: _______________________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // EMPRESA (Closer)
      pdf.text('EMPRESA (Closer): ______________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // PEP
      pdf.text('PEP:__________________________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // EMPRESA (PEP)
      pdf.text('EMPRESA (PEP): ________________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // LIDER DE SALA
      pdf.text('LIDER DE SALA: ________________________________________________________________________', 15, yPos);
      yPos += 8;
      
      // SUB LIDER DE SALA
      pdf.text('SUB LIDER DE SALA: ____________________________________________________________________', 15, yPos);
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de cadastro:', error);
      throw new Error('Falha na geração do PDF de cadastro do cliente');
    }
  }

  // Página 2: Negociação de Cota
  static gerarPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): string {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('datauristring');
  }

  static gerarPDFNegociacaoBlob(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): Blob {
    const pdf = this.createPDFNegociacao(dadosCliente, dadosNegociacao);
    return pdf.output('blob');
  }

  private static createPDFNegociacao(dadosCliente: DadosCliente, dadosNegociacao: DadosNegociacao): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Cabeçalho
      this.createHeader(pdf, 'Ficha de Negociação de Cota', 'Página: 2 de 2');
      
      let yPos = 45;
      
      // CLIENTE
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text('CLIENTE:', 15, yPos);
      pdf.line(40, yPos, 195, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosCliente.nome || '', 42, yPos);
      yPos += 8;
      
      // CPF
      pdf.setFont("helvetica", "bold");
      pdf.text('CPF:', 15, yPos);
      pdf.line(30, yPos, 195, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(dadosCliente.cpf || '', 32, yPos);
      yPos += 8;
      
      // SALA DE VENDAS
      pdf.setFont("helvetica", "bold");
      pdf.text('SALA DE VENDAS:', 15, yPos);
      pdf.line(50, yPos, 195, yPos);
      yPos += 12;
      
      // Tipos de venda (checkboxes)
      const tipos = [
        { key: 'padrao', label: 'PADRÃO' },
        { key: 'semestral', label: 'SEMESTRAL' },
        { key: 'anual', label: 'ANUAL' },
        { key: 'a-vista', label: 'À VISTA' },
        { key: 'ate-36x', label: 'ATÉ 36x' },
        { key: 'linear', label: 'LINEAR' }
      ];
      
      let xPos = 15;
      tipos.forEach(tipo => {
        pdf.text('(', xPos, yPos);
        if (dadosNegociacao.tipoVenda === tipo.key) {
          pdf.text('☑', xPos + 1, yPos);
        } else {
          pdf.text(' ', xPos + 1, yPos);
        }
        pdf.text(')', xPos + 3, yPos);
        pdf.text(tipo.label, xPos + 7, yPos);
        xPos += tipo.label.length * 2 + 15;
      });
      yPos += 15;
      
      // Tabela: Tipo de Parcela Paga em Sala
      this.createTableNegociacao(pdf, yPos, dadosNegociacao);
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de negociação:', error);
      throw new Error('Falha na geração do PDF de negociação');
    }
  }

  private static createTableNegociacao(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao) {
    // Cabeçalho da tabela de parcelas
    pdf.setFillColor(200, 200, 200);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    
    // Primeira linha do cabeçalho
    pdf.rect(15, yPos, 180, 8, 'F');
    pdf.rect(15, yPos, 180, 8);
    
    // Colunas
    const col1 = 40; // Tipo de Parcela Paga em Sala
    const col2 = 35; // Valor Total Pago em Sala  
    const col3 = 30; // Quantidade de cotas
    const col4 = 40; // Valor distribuído para cada Unidade
    const col5 = 35; // Forma de Pagamento
    
    // Linhas divisórias verticais
    pdf.line(15 + col1, yPos, 15 + col1, yPos + 8);
    pdf.line(15 + col1 + col2, yPos, 15 + col1 + col2, yPos + 8);
    pdf.line(15 + col1 + col2 + col3, yPos, 15 + col1 + col2 + col3, yPos + 8);
    pdf.line(15 + col1 + col2 + col3 + col4, yPos, 15 + col1 + col2 + col3 + col4, yPos + 8);
    
    // Textos do cabeçalho
    pdf.text('Tipo de Parcela Paga', 17, yPos + 3);
    pdf.text('em Sala', 17, yPos + 6);
    
    pdf.text('Valor Total Pago em', 15 + col1 + 2, yPos + 3);
    pdf.text('Sala', 15 + col1 + 2, yPos + 6);
    
    pdf.text('Quantidade de', 15 + col1 + col2 + 2, yPos + 3);
    pdf.text('cotas', 15 + col1 + col2 + 2, yPos + 6);
    
    pdf.text('Valor distribuído para', 15 + col1 + col2 + col3 + 2, yPos + 3);
    pdf.text('cada Unidade', 15 + col1 + col2 + col3 + 2, yPos + 6);
    
    pdf.text('Forma de Pagamento', 15 + col1 + col2 + col3 + col4 + 2, yPos + 3);
    
    yPos += 8;
    
    // Linhas de dados (3 linhas com checkboxes)
    const opcoes = ['( ) Entrada', '( ) Sinal', '( ) Saldo'];
    
    for (let i = 0; i < 3; i++) {
      pdf.setFont("helvetica", "normal");
      pdf.rect(15, yPos, 180, 8);
      
      // Linhas divisórias verticais
      pdf.line(15 + col1, yPos, 15 + col1, yPos + 8);
      pdf.line(15 + col1 + col2, yPos, 15 + col1 + col2, yPos + 8);
      pdf.line(15 + col1 + col2 + col3, yPos, 15 + col1 + col2 + col3, yPos + 8);
      pdf.line(15 + col1 + col2 + col3 + col4, yPos, 15 + col1 + col2 + col3 + col4, yPos + 8);
      
      // Primeira coluna com checkboxes
      pdf.text(opcoes[i], 17, yPos + 5);
      
      // Dados das parcelas se existirem
      const parcela = dadosNegociacao.parcelasPagasSala[i];
      if (parcela) {
        pdf.text(parcela.valorTotal || '', 15 + col1 + 2, yPos + 5);
        pdf.text(parcela.quantidadeCotas || '', 15 + col1 + col2 + 2, yPos + 5);
        pdf.text(parcela.valorDistribuido || '', 15 + col1 + col2 + col3 + 2, yPos + 5);
        pdf.text(parcela.formasPagamento[0] || '', 15 + col1 + col2 + col3 + col4 + 2, yPos + 5);
      }
      
      yPos += 8;
    }
    
    yPos += 10;
    
    // Tabela de Contratos
    this.createContractTable(pdf, yPos, dadosNegociacao);
  }

  private static createContractTable(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao) {
    // Cabeçalho da tabela de contratos
    pdf.setFillColor(200, 200, 200);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    
    pdf.rect(15, yPos, 180, 8, 'F');
    pdf.rect(15, yPos, 180, 8);
    
    // Definir larguras das colunas
    const colWidths = [20, 35, 25, 15, 15, 25, 15, 30];
    let xPos = 15;
    
    const headers = ['Contrato', 'Empreendimento', 'Torre/Bloco', 'Apt.', 'Cota', 'Vista da UH.', 'PCD', 'Valor'];
    
    // Linhas divisórias e textos
    headers.forEach((header, index) => {
      if (index > 0) {
        pdf.line(xPos, yPos, xPos, yPos + 8);
      }
      pdf.text(header, xPos + 2, yPos + 5);
      xPos += colWidths[index];
    });
    
    yPos += 8;
    
    // 4 linhas de contratos
    for (let i = 0; i < 4; i++) {
      pdf.setFont("helvetica", "normal");
      pdf.rect(15, yPos, 180, 10);
      
      xPos = 15;
      
      // Primeira coluna com checkboxes
      pdf.text('( ) Físico', xPos + 2, yPos + 4);
      pdf.text('( ) Digital', xPos + 2, yPos + 8);
      xPos += colWidths[0];
      
      // Linha divisória
      pdf.line(xPos, yPos, xPos, yPos + 10);
      
      // Empreendimento - buscar nome do empreendimento pelo ID
      const contrato = dadosNegociacao.contratos[i];
      if (contrato) {
        // Se empreendimento for um ID, buscar o nome no localStorage dos empreendimentos
        let nomeEmpreendimento = contrato.empreendimento || '';

        // Tentar buscar dados dos empreendimentos do localStorage
        try {
          const empreendimentosData = localStorage.getItem('empreendimentos_cache');
          if (empreendimentosData) {
            const empreendimentos = JSON.parse(empreendimentosData);
            const emp = empreendimentos.find((e: any) => e.id === contrato.empreendimento);
            if (emp) {
              nomeEmpreendimento = emp.nome;
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar nome do empreendimento:', error);
        }

        pdf.text(nomeEmpreendimento, xPos + 2, yPos + 6);
      }
      xPos += colWidths[1];
      
      // Torre/Bloco
      pdf.line(xPos, yPos, xPos, yPos + 10);
      if (contrato) {
        pdf.text(contrato.torre || '', xPos + 2, yPos + 6);
      }
      xPos += colWidths[2];
      
      // Apt.
      pdf.line(xPos, yPos, xPos, yPos + 10);
      if (contrato) {
        pdf.text(contrato.apartamento || '', xPos + 2, yPos + 6);
      }
      xPos += colWidths[3];
      
      // Cota
      pdf.line(xPos, yPos, xPos, yPos + 10);
      if (contrato) {
        pdf.text(contrato.cota || '', xPos + 2, yPos + 6);
      }
      xPos += colWidths[4];
      
      // Vista da UH
      pdf.line(xPos, yPos, xPos, yPos + 10);
      pdf.text('( ) Sim', xPos + 2, yPos + 4);
      pdf.text('( ) Não', xPos + 2, yPos + 8);
      xPos += colWidths[5];
      
      // PCD
      pdf.line(xPos, yPos, xPos, yPos + 10);
      pdf.text('( ) Sim', xPos + 2, yPos + 4);
      pdf.text('( ) Não', xPos + 2, yPos + 8);
      xPos += colWidths[6];
      
      // Valor
      pdf.line(xPos, yPos, xPos, yPos + 10);
      if (contrato) {
        pdf.text(contrato.valor || '', xPos + 2, yPos + 6);
      }
      
      yPos += 10;
    }
    
    yPos += 5;
    
    // Texto explicativo
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text('O financeiro descrito abaixo é referente a cada unidade separadamente.', 15, yPos);
    yPos += 10;
    
    // Tabela de informações financeiras
    this.createPaymentTable(pdf, yPos, dadosNegociacao);
  }

  private static createPaymentTable(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao) {
    // Cabeçalho da tabela de pagamentos
    pdf.setFillColor(200, 200, 200);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    
    pdf.rect(15, yPos, 180, 8, 'F');
    pdf.rect(15, yPos, 180, 8);
    
    const colWidths = [30, 30, 25, 25, 35, 35];
    let xPos = 15;
    
    const headers = ['Tipo', 'Total', 'Qtd. Parcelas', 'Valor Parcela', 'Forma de Pag.', '1º Vencimento'];
    
    headers.forEach((header, index) => {
      if (index > 0) {
        pdf.line(xPos, yPos, xPos, yPos + 8);
      }
      pdf.text(header, xPos + 2, yPos + 5);
      xPos += colWidths[index];
    });
    
    yPos += 8;
    
    // 5 linhas fixas de pagamento
    const tiposPagamento = ['Entrada', 'Entrada', 'Entrada Restante', 'Sinal', 'Saldo'];
    
    tiposPagamento.forEach((tipo, index) => {
      pdf.setFont("helvetica", "normal");
      pdf.rect(15, yPos, 180, 8);
      
      xPos = 15;
      
      // Linhas divisórias verticais
      colWidths.forEach((width, colIndex) => {
        if (colIndex > 0) {
          pdf.line(xPos, yPos, xPos, yPos + 8);
        }
        xPos += width;
      });
      
      // Dados
      xPos = 15;
      pdf.text(tipo, xPos + 2, yPos + 5);
      xPos += colWidths[0];
      
      // Buscar dados correspondentes
      const infoPagamento = dadosNegociacao.informacoesPagamento.find(info => 
        info.tipo.toLowerCase().includes(tipo.toLowerCase()) ||
        (tipo === 'Entrada Restante' && info.tipo.includes('Restante'))
      );
      
      if (infoPagamento) {
        pdf.text(infoPagamento.total || '', xPos + 2, yPos + 5);
        xPos += colWidths[1];
        
        pdf.text(infoPagamento.qtdParcelas || '', xPos + 2, yPos + 5);
        xPos += colWidths[2];
        
        pdf.text(infoPagamento.valorParcela || '', xPos + 2, yPos + 5);
        xPos += colWidths[3];
        
        pdf.text(infoPagamento.formaPagamento || '', xPos + 2, yPos + 5);
        xPos += colWidths[4];
        
        const dataVenc = infoPagamento.primeiroVencimento ? 
          new Date(infoPagamento.primeiroVencimento).toLocaleDateString('pt-BR') : '';
        pdf.text(dataVenc, xPos + 2, yPos + 5);
      }
      
      yPos += 8;
    });
  }
}
