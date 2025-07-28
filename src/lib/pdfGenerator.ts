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
  // Função auxiliar para buscar nome do empreendimento
  private static getNomeEmpreendimento(empreendimentoId: string): string {
    try {
      const empreendimentosData = localStorage.getItem('empreendimentos_cache');
      if (empreendimentosData) {
        const empreendimentos = JSON.parse(empreendimentosData);
        const emp = empreendimentos.find((e: any) => e.id === empreendimentoId);
        return emp ? emp.nome : empreendimentoId;
      }
    } catch (error) {
      console.warn('Erro ao buscar nome do empreendimento:', error);
    }
    return empreendimentoId;
  }

  // Função para criar cabeçalho padronizado
  private static createHeader(pdf: jsPDF, titulo: string, pagina: string) {
    // Bordas do cabeçalho
    pdf.setLineWidth(0.5);
    
    // Logo GAV (caixa esquerda)
    pdf.rect(15, 15, 40, 20);
    pdf.setFillColor(41, 128, 185);
    pdf.rect(15, 15, 40, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("GAV", 30, 25);
    pdf.setFontSize(8);
    pdf.text("RESORTS", 27, 30);
    
    // Reset cor do texto
    pdf.setTextColor(0, 0, 0);
    
    // Caixa central com título
    pdf.rect(55, 15, 95, 20);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("FORMULÁRIO", 102, 20, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(titulo, 102, 28, { align: 'center' });
    
    // Caixa direita com informações
    pdf.rect(150, 15, 45, 20);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Código:FOR.02.01.002", 152, 20);
    pdf.text("Rev.: 24/07/2025-Ver.02", 152, 24);
    pdf.text(pagina, 152, 28);
  }

  // Função para criar tabela com bordas
  private static createTableCell(
    pdf: jsPDF,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number = 8,
    bold: boolean = false
  ) {
    pdf.rect(x, y, width, height);
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    
    // Quebrar texto se for muito longo
    const lines = pdf.splitTextToSize(text, width - 2);
    const lineHeight = fontSize * 0.35;
    const startY = y + 3 + (fontSize * 0.3);
    
    for (let i = 0; i < lines.length && i < Math.floor(height / lineHeight); i++) {
      pdf.text(lines[i], x + 1, startY + (i * lineHeight));
    }
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
      pdf.setFillColor(230, 230, 230);
      pdf.rect(15, yPos, 180, 8, 'F');
      pdf.rect(15, yPos, 180, 8);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text('DADOS DO CLIENTE:', 17, yPos + 5);
      yPos += 8;
      
      // Tabela dos dados do cliente
      const rowHeight = 8;
      
      // Nome
      this.createTableCell(pdf, 'Nome:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.nome || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // CPF
      this.createTableCell(pdf, 'CPF:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.cpf || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // RG, ÓRGÃO, UF
      this.createTableCell(pdf, 'RG:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.rg || '', 45, yPos, 90, rowHeight);
      this.createTableCell(pdf, 'ÓRGÃO:', 135, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.orgaoEmissor || '', 165, yPos, 20, rowHeight);
      this.createTableCell(pdf, 'UF:', 185, yPos, 10, rowHeight);
      yPos += rowHeight;
      
      // Profissão
      this.createTableCell(pdf, 'Profissão:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.profissao || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // Estado Civil
      this.createTableCell(pdf, 'Estado Civil:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.estadoCivil || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // E-mail
      this.createTableCell(pdf, 'E-mail:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.email || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // Telefone
      this.createTableCell(pdf, 'Telefone:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.telefone || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight + 5;
      
      // DADOS DO CÔNJUGE
      pdf.setFillColor(230, 230, 230);
      pdf.rect(15, yPos, 180, 8, 'F');
      pdf.rect(15, yPos, 180, 8);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text('DADOS DO CÔNJUGE:', 17, yPos + 5);
      yPos += 8;
      
      // Nome cônjuge
      this.createTableCell(pdf, 'Nome:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.nomeConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // CPF cônjuge
      this.createTableCell(pdf, 'CPF:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.cpfConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // RG, ÓRGÃO, UF cônjuge
      this.createTableCell(pdf, 'RG:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.rgConjuge || '', 45, yPos, 90, rowHeight);
      this.createTableCell(pdf, 'ÓRGÃO:', 135, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.orgaoEmissorConjuge || '', 165, yPos, 20, rowHeight);
      this.createTableCell(pdf, 'UF:', 185, yPos, 10, rowHeight);
      yPos += rowHeight;
      
      // Profissão cônjuge
      this.createTableCell(pdf, 'Profissão:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.profissaoConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // Estado Civil cônjuge
      this.createTableCell(pdf, 'Estado Civil:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.estadoCivilConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // E-mail cônjuge
      this.createTableCell(pdf, 'E-mail:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.emailConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // Telefone cônjuge
      this.createTableCell(pdf, 'Telefone:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.telefoneConjuge || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight + 5;
      
      // ENDEREÇO
      pdf.setFillColor(230, 230, 230);
      pdf.rect(15, yPos, 180, 8, 'F');
      pdf.rect(15, yPos, 180, 8);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text('ENDEREÇO:', 17, yPos + 5);
      yPos += 8;
      
      // Logradouro e Nº
      this.createTableCell(pdf, 'Logradouro:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.endereco || '', 45, yPos, 120, rowHeight);
      this.createTableCell(pdf, 'Nº:', 165, yPos, 15, rowHeight);
      this.createTableCell(pdf, dadosCliente.numeroResidencia || '', 180, yPos, 15, rowHeight);
      yPos += rowHeight;
      
      // Bairro
      this.createTableCell(pdf, 'Bairro:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.bairro || '', 45, yPos, 150, rowHeight);
      yPos += rowHeight;
      
      // Complemento e CEP
      this.createTableCell(pdf, 'Complemento:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.complemento || '', 45, yPos, 90, rowHeight);
      this.createTableCell(pdf, 'CEP:', 135, yPos, 20, rowHeight);
      this.createTableCell(pdf, dadosCliente.cep || '', 155, yPos, 40, rowHeight);
      yPos += rowHeight;
      
      // Cidade e UF
      this.createTableCell(pdf, 'Cidade:', 15, yPos, 30, rowHeight);
      this.createTableCell(pdf, dadosCliente.cidade || '', 45, yPos, 120, rowHeight);
      this.createTableCell(pdf, 'UF:', 165, yPos, 15, rowHeight);
      this.createTableCell(pdf, dadosCliente.estado || '', 180, yPos, 15, rowHeight);
      yPos += rowHeight + 10;
      
      // SALA DE VENDAS
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text('SALA DE VENDAS:', 15, yPos);
      
      // Checkbox BEEBACK
      pdf.rect(160, yPos - 4, 4, 4);
      pdf.text('☑', 161, yPos - 1);
      pdf.text('BEEBACK', 170, yPos);
      yPos += 12;
      
      // Linhas para preenchimento manual
      const lineLength = 170;
      
      pdf.text('LINER:', 15, yPos);
      pdf.line(35, yPos, 35 + lineLength, yPos);
      yPos += 8;
      
      pdf.text('EMPRESA (Liner):', 15, yPos);
      pdf.line(55, yPos, 55 + lineLength - 20, yPos);
      yPos += 8;
      
      pdf.text('CLOSER:', 15, yPos);
      pdf.line(40, yPos, 40 + lineLength, yPos);
      yPos += 8;
      
      pdf.text('EMPRESA (Closer):', 15, yPos);
      pdf.line(60, yPos, 60 + lineLength - 25, yPos);
      yPos += 8;
      
      pdf.text('PEP:', 15, yPos);
      pdf.line(30, yPos, 30 + lineLength, yPos);
      yPos += 8;
      
      pdf.text('EMPRESA (PEP):', 15, yPos);
      pdf.line(55, yPos, 55 + lineLength - 20, yPos);
      yPos += 8;
      
      pdf.text('LIDER DE SALA:', 15, yPos);
      pdf.line(50, yPos, 50 + lineLength - 15, yPos);
      yPos += 8;
      
      pdf.text('SUB LIDER DE SALA:', 15, yPos);
      pdf.line(65, yPos, 65 + lineLength - 30, yPos);
      
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
      pdf.line(55, yPos, 195, yPos);
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
        xPos += tipo.label.length * 2.5 + 15;
      });
      yPos += 15;
      
      // Tabela: Tipo de Parcela Paga em Sala
      this.createParcelasPagasTable(pdf, yPos, dadosNegociacao);
      yPos += 40;
      
      // Primeira tabela de contratos
      this.createContratosTable(pdf, yPos, dadosNegociacao, 0);
      yPos += 50;
      
      // Texto explicativo
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text('O financeiro descrito abaixo é referente a cada unidade separadamente.', 15, yPos);
      yPos += 10;
      
      // Primeira tabela financeira
      this.createFinanceiroTable(pdf, yPos, dadosNegociacao);
      yPos += 50;
      
      // Segunda tabela de contratos
      this.createContratosTable(pdf, yPos, dadosNegociacao, 4);
      yPos += 50;
      
      // Texto explicativo novamente
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text('O financeiro descrito abaixo é referente a cada unidade separadamente.', 15, yPos);
      yPos += 10;
      
      // Segunda tabela financeira
      this.createFinanceiroTable(pdf, yPos, dadosNegociacao);
      
      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de negociação:', error);
      throw new Error('Falha na geração do PDF de negociação');
    }
  }

  private static createParcelasPagasTable(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao) {
    // Cabeçalho da tabela
    const headers = ['Tipo de Parcela Paga\nem Sala', 'Valor Total Pago em\nSala', 'Quantidade de\ncotas', 'Valor distribuído para\ncada Unidade', 'Forma de Pagamento'];
    const widths = [45, 35, 30, 40, 40];
    
    // Cabeçalho
    let xPos = 15;
    pdf.setFillColor(230, 230, 230);
    headers.forEach((header, index) => {
      pdf.rect(xPos, yPos, widths[index], 12, 'F');
      pdf.rect(xPos, yPos, widths[index], 12);
      this.createTableCell(pdf, header, xPos, yPos, widths[index], 12, 8, true);
      xPos += widths[index];
    });
    
    yPos += 12;
    
    // Linhas de dados
    const opcoes = ['( ) Entrada', '( ) Sinal', '( ) Saldo'];
    
    for (let i = 0; i < 3; i++) {
      xPos = 15;
      
      // Primeira coluna com checkboxes
      this.createTableCell(pdf, opcoes[i], xPos, yPos, widths[0], 8);
      xPos += widths[0];
      
      // Dados das parcelas se existirem
      const parcela = dadosNegociacao.parcelasPagasSala[i];
      
      this.createTableCell(pdf, parcela?.valorTotal || '', xPos, yPos, widths[1], 8);
      xPos += widths[1];
      
      this.createTableCell(pdf, parcela?.quantidadeCotas || '', xPos, yPos, widths[2], 8);
      xPos += widths[2];
      
      this.createTableCell(pdf, parcela?.valorDistribuido || '', xPos, yPos, widths[3], 8);
      xPos += widths[3];
      
      this.createTableCell(pdf, parcela?.formasPagamento?.[0] || '', xPos, yPos, widths[4], 8);
      
      yPos += 8;
    }
  }

  private static createContratosTable(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao, startIndex: number) {
    // Cabeçalho da tabela de contratos
    const headers = ['Contrato', 'Empreendimento', 'Torre/Bloco', 'Apt.', 'Cota', 'Vista da UH.', 'PCD', 'Valor'];
    const widths = [22, 35, 25, 15, 15, 25, 15, 38];
    
    // Cabeçalho
    let xPos = 15;
    pdf.setFillColor(230, 230, 230);
    headers.forEach((header, index) => {
      pdf.rect(xPos, yPos, widths[index], 8, 'F');
      pdf.rect(xPos, yPos, widths[index], 8);
      this.createTableCell(pdf, header, xPos, yPos, widths[index], 8, 8, true);
      xPos += widths[index];
    });
    
    yPos += 8;
    
    // 4 linhas de contratos
    for (let i = 0; i < 4; i++) {
      xPos = 15;
      const contratoIndex = startIndex + i;
      
      // Contrato (Físico/Digital)
      this.createTableCell(pdf, '( ) Físico\n( ) Digital', xPos, yPos, widths[0], 10);
      xPos += widths[0];
      
      // Empreendimento
      const contrato = dadosNegociacao.contratos[contratoIndex];
      let nomeEmpreendimento = '';
      if (contrato) {
        nomeEmpreendimento = this.getNomeEmpreendimento(contrato.empreendimento);
      }
      this.createTableCell(pdf, nomeEmpreendimento, xPos, yPos, widths[1], 10);
      xPos += widths[1];
      
      // Torre/Bloco
      this.createTableCell(pdf, contrato?.torre || '', xPos, yPos, widths[2], 10);
      xPos += widths[2];
      
      // Apt.
      this.createTableCell(pdf, contrato?.apartamento || '', xPos, yPos, widths[3], 10);
      xPos += widths[3];
      
      // Cota
      this.createTableCell(pdf, contrato?.cota || '', xPos, yPos, widths[4], 10);
      xPos += widths[4];
      
      // Vista da UH
      this.createTableCell(pdf, '( ) Sim\n( ) Não', xPos, yPos, widths[5], 10);
      xPos += widths[5];
      
      // PCD
      this.createTableCell(pdf, '( ) Sim\n( ) Não', xPos, yPos, widths[6], 10);
      xPos += widths[6];
      
      // Valor
      this.createTableCell(pdf, contrato?.valor || '', xPos, yPos, widths[7], 10);
      
      yPos += 10;
    }
  }

  private static createFinanceiroTable(pdf: jsPDF, yPos: number, dadosNegociacao: DadosNegociacao) {
    // Cabeçalho da tabela financeira
    const headers = ['Tipo', 'Total', 'Qtd. Parcelas', 'Valor Parcela', 'Forma de\nPag.', '1º Vencimento'];
    const widths = [25, 25, 25, 25, 25, 35];
    
    // Cabeçalho
    let xPos = 15;
    pdf.setFillColor(230, 230, 230);
    headers.forEach((header, index) => {
      pdf.rect(xPos, yPos, widths[index], 8, 'F');
      pdf.rect(xPos, yPos, widths[index], 8);
      this.createTableCell(pdf, header, xPos, yPos, widths[index], 8, 8, true);
      xPos += widths[index];
    });
    
    yPos += 8;
    
    // 5 linhas fixas de pagamento
    const tiposPagamento = ['Entrada', 'Entrada', 'Entrada Restante', 'Sinal', 'Saldo'];
    
    tiposPagamento.forEach((tipo) => {
      xPos = 15;
      
      // Tipo
      this.createTableCell(pdf, tipo, xPos, yPos, widths[0], 8);
      xPos += widths[0];
      
      // Buscar dados correspondentes
      const infoPagamento = dadosNegociacao.informacoesPagamento.find(info => 
        info.tipo.toLowerCase().includes(tipo.toLowerCase()) ||
        (tipo === 'Entrada Restante' && info.tipo.includes('Restante'))
      );
      
      // Total
      this.createTableCell(pdf, infoPagamento?.total || '', xPos, yPos, widths[1], 8);
      xPos += widths[1];
      
      // Qtd. Parcelas
      this.createTableCell(pdf, infoPagamento?.qtdParcelas || '', xPos, yPos, widths[2], 8);
      xPos += widths[2];
      
      // Valor Parcela
      this.createTableCell(pdf, infoPagamento?.valorParcela || '', xPos, yPos, widths[3], 8);
      xPos += widths[3];
      
      // Forma de Pag.
      this.createTableCell(pdf, infoPagamento?.formaPagamento || '', xPos, yPos, widths[4], 8);
      xPos += widths[4];
      
      // 1º Vencimento
      const dataVenc = infoPagamento?.primeiroVencimento ? 
        new Date(infoPagamento.primeiroVencimento).toLocaleDateString('pt-BR') : '';
      this.createTableCell(pdf, dataVenc, xPos, yPos, widths[5], 8);
      
      yPos += 8;
    });
  }
}
