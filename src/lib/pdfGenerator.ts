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
  logradouro?: string;
  numeroEndereco?: string;
  bairro?: string;
  complemento?: string;
  cep?: string;
  cidade?: string;
  ufEndereco?: string;
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  estadoEmissorConjuge?: string;
  profissaoConjuge?: string;
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
    empreendimento: string;
    categoriaPreco: string;
    valor: string;
    torre?: string;
    apartamento?: string;
    cota?: string;
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
  private static createFormHeader(pdf: jsPDF, title: string, pageInfo: string) {
    // Box principal do header (tabela com 3 colunas)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Primeira coluna - Logo GAV
    pdf.rect(10, 10, 40, 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("GAV", 25, 19);
    pdf.setFontSize(8);
    pdf.text("RESORTS", 22, 25);

    // Segunda coluna - Título
    pdf.rect(50, 10, 110, 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("FORMULÁRIO", 95, 16);
    pdf.setFontSize(12);
    pdf.text(title, 70, 24);

    // Terceira coluna - Código e info
    pdf.rect(160, 10, 40, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("Código:FOR.02.01.002", 162, 15);
    pdf.text("Rev.: 24/07/2025-Ver.02", 162, 19);
    pdf.text(pageInfo, 162, 23);
  }

  private static createTableWithBorder(
    pdf: jsPDF, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);
  }

  private static createFieldInTable(
    pdf: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number = 8
  ) {
    // Borda do campo
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, y, width, height);
    
    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(label + ":", x + 1, y + 4);
    
    // Valor (se existir)
    if (value) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(value, x + 1, y + height - 1);
    }
  }

  private static createTableCell(
    pdf: jsPDF,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number = 7,
    bold: boolean = false
  ) {
    // Borda
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, y, width, height);
    
    // Texto
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    
    // Quebrar texto se muito longo
    const lines = pdf.splitTextToSize(text, width - 2);
    let textY = y + 4;
    
    for (let i = 0; i < lines.length && i < Math.floor(height / 3); i++) {
      pdf.text(lines[i], x + 1, textY);
      textY += 3;
    }
  }

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
      // Header oficial
      this.createFormHeader(pdf, "Ficha de Cadastro de Cliente", "Página: 1 de 2");

      let yPos = 40;

      // DADOS DO CLIENTE
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("DADOS DO CLIENTE:", 10, yPos);
      yPos += 5;

      // Tabela completa para dados do cliente
      this.createTableWithBorder(pdf, 10, yPos, 190, 82);
      
      // Campos do cliente
      this.createFieldInTable(pdf, "Nome", dadosCliente.nome || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "CPF", dadosCliente.cpf || "", 10, yPos, 190, 12);
      yPos += 12;

      // RG, ÓRGÃO, UF na mesma linha
      this.createFieldInTable(pdf, "RG", dadosCliente.rg || "", 10, yPos, 110, 12);
      this.createFieldInTable(pdf, "ÓRGÃO", dadosCliente.orgaoEmissor || "", 120, yPos, 35, 12);
      this.createFieldInTable(pdf, "UF", dadosCliente.estadoEmissor || "", 155, yPos, 45, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Profissão", dadosCliente.profissao || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Estado Civil", dadosCliente.estadoCivil || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "E-mail", dadosCliente.email || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Telefone", dadosCliente.telefone || "", 10, yPos, 190, 10);
      yPos += 20;

      // DADOS DO CÔNJUGE
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("DADOS DO CÔNJUGE:", 10, yPos);
      yPos += 5;

      // Tabela para dados do cônjuge
      this.createTableWithBorder(pdf, 10, yPos, 190, 82);
      
      this.createFieldInTable(pdf, "Nome", dadosCliente.nomeConjuge || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "CPF", dadosCliente.cpfConjuge || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "RG", dadosCliente.rgConjuge || "", 10, yPos, 110, 12);
      this.createFieldInTable(pdf, "ÓRGÃO", dadosCliente.orgaoEmissorConjuge || "", 120, yPos, 35, 12);
      this.createFieldInTable(pdf, "UF", dadosCliente.estadoEmissorConjuge || "", 155, yPos, 45, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Profissão", dadosCliente.profissaoConjuge || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Estado Civil", "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "E-mail", dadosCliente.emailConjuge || "", 10, yPos, 190, 12);
      yPos += 12;

      this.createFieldInTable(pdf, "Telefone", dadosCliente.telefoneConjuge || "", 10, yPos, 190, 10);
      yPos += 20;

      // ENDEREÇO
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("ENDEREÇO:", 10, yPos);
      yPos += 5;

      // Tabela para endereço
      this.createTableWithBorder(pdf, 10, yPos, 190, 50);
      
      // Logradouro e Nº
      this.createFieldInTable(pdf, "Logradouro", dadosCliente.logradouro || "", 10, yPos, 140, 12);
      this.createFieldInTable(pdf, "Nº", dadosCliente.numeroEndereco || "", 150, yPos, 50, 12);
      yPos += 12;

      // Bairro
      this.createFieldInTable(pdf, "Bairro", dadosCliente.bairro || "", 10, yPos, 190, 12);
      yPos += 12;

      // Complemento e CEP
      this.createFieldInTable(pdf, "Complemento", dadosCliente.complemento || "", 10, yPos, 140, 12);
      this.createFieldInTable(pdf, "CEP", dadosCliente.cep || "", 150, yPos, 50, 12);
      yPos += 12;

      // Cidade e UF
      this.createFieldInTable(pdf, "Cidade", dadosCliente.cidade || "", 10, yPos, 140, 12);
      this.createFieldInTable(pdf, "UF", dadosCliente.ufEndereco || "", 150, yPos, 50, 14);
      yPos += 25;

      // SALA DE VENDAS
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("SALA DE VENDAS:", 10, yPos);
      // Checkbox BEEBACK
      pdf.rect(165, yPos - 5, 4, 4);
      pdf.text("BEEBACK", 172, yPos);
      yPos += 8;

      // Campos com linhas
      pdf.text("LINER:", 10, yPos);
      pdf.line(30, yPos, 200, yPos);
      yPos += 8;

      pdf.text("EMPRESA (Liner):", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 8;

      pdf.text("CLOSER:", 10, yPos);
      pdf.line(30, yPos, 200, yPos);
      yPos += 8;

      pdf.text("EMPRESA (Closer):", 10, yPos);
      pdf.line(55, yPos, 200, yPos);
      yPos += 8;

      pdf.text("PEP:", 10, yPos);
      pdf.line(25, yPos, 200, yPos);
      yPos += 8;

      pdf.text("EMPRESA (PEP):", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 8;

      pdf.text("LIDER DE SALA:", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 8;

      pdf.text("SUB LIDER DE SALA:", 10, yPos);
      pdf.line(65, yPos, 200, yPos);

      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de cadastro:', error);
      throw new Error('Falha na geração do PDF de cadastro do cliente');
    }
  }

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
      // Header oficial
      this.createFormHeader(pdf, "Ficha de Negociação de Cota", "Página: 2 de 2");

      let yPos = 40;

      // CLIENTE e CPF
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("CLIENTE:", 10, yPos);
      pdf.line(30, yPos, 200, yPos);
      if (dadosCliente.nome) {
        pdf.setFont("helvetica", "normal");
        pdf.text(dadosCliente.nome, 32, yPos);
      }
      yPos += 8;

      pdf.setFont("helvetica", "bold");
      pdf.text("CPF:", 10, yPos);
      pdf.line(25, yPos, 200, yPos);
      if (dadosCliente.cpf) {
        pdf.setFont("helvetica", "normal");
        pdf.text(dadosCliente.cpf, 27, yPos);
      }
      yPos += 8;

      pdf.setFont("helvetica", "bold");
      pdf.text("SALA DE VENDAS:", 10, yPos);
      pdf.line(50, yPos, 200, yPos);
      yPos += 10;

      // Checkboxes de tipos de venda
      const tipos = [
        { label: "PADRÃO", value: "padrao" },
        { label: "SEMESTRAL", value: "semestral" },
        { label: "ANUAL", value: "anual" },
        { label: "À VISTA", value: "a-vista" },
        { label: "ATÉ 36x", value: "ate-36x" },
        { label: "LINEAR", value: "linear" }
      ];

      let xPos = 10;
      tipos.forEach(tipo => {
        const isSelected = dadosNegociacao.tipoVenda === tipo.value;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`( ${isSelected ? 'X' : ' '} ) ${tipo.label}`, xPos, yPos);
        xPos += 32;
      });
      yPos += 15;

      // Tabela: Tipo de Parcela Paga em Sala
      const headers1 = [
        "Tipo de Parcela Paga em Sala",
        "Valor Total Pago em Sala", 
        "Quantidade de cotas",
        "Valor distribuido para cada Unidade",
        "Forma de Pagamento"
      ];
      const widths1 = [38, 38, 38, 38, 38];

      // Cabeçalho
      let currentX = 10;
      headers1.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, widths1[i], 12, 7, true);
        currentX += widths1[i];
      });
      yPos += 12;

      // 3 linhas de dados
      const tiposFixos = ["( ) Entrada", "( ) Sinal", "( ) Saldo"];
      for (let i = 0; i < 3; i++) {
        currentX = 10;
        const parcela = dadosNegociacao.parcelasPagasSala[i];
        
        this.createTableCell(pdf, tiposFixos[i], currentX, yPos, widths1[0], 8);
        currentX += widths1[0];
        
        this.createTableCell(pdf, parcela?.valorTotal || "", currentX, yPos, widths1[1], 8);
        currentX += widths1[1];
        
        this.createTableCell(pdf, parcela?.quantidadeCotas || "", currentX, yPos, widths1[2], 8);
        currentX += widths1[2];
        
        this.createTableCell(pdf, parcela?.valorDistribuido || "", currentX, yPos, widths1[3], 8);
        currentX += widths1[3];
        
        this.createTableCell(pdf, parcela?.formasPagamento?.[0] || "", currentX, yPos, widths1[4], 8);
        
        yPos += 8;
      }
      yPos += 10;

      // Primeira tabela de contratos
      const contratoHeaders = ["Contrato", "Empreendimento", "Torre/Bloco", "Apt.", "Cota", "Vista da UH.", "PCD", "Valor"];
      const contratoWidths = [20, 30, 25, 20, 20, 25, 20, 30];

      // Cabeçalho da tabela de contratos
      currentX = 10;
      contratoHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, contratoWidths[i], 10, 7, true);
        currentX += contratoWidths[i];
      });
      yPos += 10;

      // 4 linhas de contratos
      for (let i = 0; i < 4; i++) {
        currentX = 10;
        const contrato = dadosNegociacao.contratos[i];
        
        this.createTableCell(pdf, "( ) Físico\n( ) Digital", currentX, yPos, contratoWidths[0], 12, 6);
        currentX += contratoWidths[0];
        
        this.createTableCell(pdf, contrato?.empreendimento || "", currentX, yPos, contratoWidths[1], 12, 6);
        currentX += contratoWidths[1];
        
        this.createTableCell(pdf, contrato?.torre || "", currentX, yPos, contratoWidths[2], 12, 6);
        currentX += contratoWidths[2];
        
        this.createTableCell(pdf, contrato?.apartamento || "", currentX, yPos, contratoWidths[3], 12, 6);
        currentX += contratoWidths[3];
        
        this.createTableCell(pdf, contrato?.cota || "", currentX, yPos, contratoWidths[4], 12, 6);
        currentX += contratoWidths[4];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[5], 12, 6);
        currentX += contratoWidths[5];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[6], 12, 6);
        currentX += contratoWidths[6];
        
        this.createTableCell(pdf, contrato?.valor || "", currentX, yPos, contratoWidths[7], 12, 6);
        
        yPos += 12;
      }
      yPos += 5;

      // Texto explicativo
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("O financeiro descrito abaixo é referente a cada unidade separadamente.", 10, yPos);
      yPos += 8;

      // Tabela de informações de pagamento
      const pagHeaders = ["Tipo", "Total", "Qtd. Parcelas", "Valor Parcela", "Forma de Pag.", "1º Vencimento"];
      const pagWidths = [30, 25, 25, 25, 25, 30];

      // Cabeçalho
      currentX = 10;
      pagHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, pagWidths[i], 8, 7, true);
        currentX += pagWidths[i];
      });
      yPos += 8;

      // 5 linhas fixas de informações de pagamento
      const tiposPagamento = ["Entrada", "Entrada", "Entrada Restante", "Sinal", "Saldo"];
      for (let i = 0; i < 5; i++) {
        currentX = 10;
        
        // Buscar a informação correspondente
        let info;
        if (tiposPagamento[i] === "Entrada" && i === 0) {
          info = dadosNegociacao.informacoesPagamento.find(inf => inf.tipo === "1ª Entrada");
        } else if (tiposPagamento[i] === "Entrada" && i === 1) {
          info = dadosNegociacao.informacoesPagamento.find(inf => inf.tipo === "2ª Entrada");
        } else {
          info = dadosNegociacao.informacoesPagamento.find(inf => inf.tipo === tiposPagamento[i]);
        }
        
        this.createTableCell(pdf, tiposPagamento[i], currentX, yPos, pagWidths[0], 8, 6);
        currentX += pagWidths[0];
        
        this.createTableCell(pdf, info?.total || "", currentX, yPos, pagWidths[1], 8, 6);
        currentX += pagWidths[1];
        
        this.createTableCell(pdf, info?.qtdParcelas || "", currentX, yPos, pagWidths[2], 8, 6);
        currentX += pagWidths[2];
        
        this.createTableCell(pdf, info?.valorParcela || "", currentX, yPos, pagWidths[3], 8, 6);
        currentX += pagWidths[3];
        
        this.createTableCell(pdf, info?.formaPagamento || "", currentX, yPos, pagWidths[4], 8, 6);
        currentX += pagWidths[4];
        
        this.createTableCell(pdf, info?.primeiroVencimento || "", currentX, yPos, pagWidths[5], 8, 6);
        
        yPos += 8;
      }

      // Adicionando a segunda página (continuação)
      pdf.addPage();
      
      // Header da segunda página
      this.createFormHeader(pdf, "Ficha de Negociação de Cota", "Página: 2 de 2");
      
      yPos = 50;

      // Segunda tabela de contratos (idêntica à primeira)
      currentX = 10;
      contratoHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, contratoWidths[i], 10, 7, true);
        currentX += contratoWidths[i];
      });
      yPos += 10;

      for (let i = 0; i < 4; i++) {
        currentX = 10;
        
        this.createTableCell(pdf, "( ) Físico\n( ) Digital", currentX, yPos, contratoWidths[0], 12, 6);
        currentX += contratoWidths[0];
        
        this.createTableCell(pdf, "", currentX, yPos, contratoWidths[1], 12, 6);
        currentX += contratoWidths[1];
        
        this.createTableCell(pdf, "", currentX, yPos, contratoWidths[2], 12, 6);
        currentX += contratoWidths[2];
        
        this.createTableCell(pdf, "", currentX, yPos, contratoWidths[3], 12, 6);
        currentX += contratoWidths[3];
        
        this.createTableCell(pdf, "", currentX, yPos, contratoWidths[4], 12, 6);
        currentX += contratoWidths[4];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[5], 12, 6);
        currentX += contratoWidths[5];
        
        this.createTableCell(pdf, "( ) Sim\n( ) Não", currentX, yPos, contratoWidths[6], 12, 6);
        currentX += contratoWidths[6];
        
        this.createTableCell(pdf, "", currentX, yPos, contratoWidths[7], 12, 6);
        
        yPos += 12;
      }
      yPos += 5;

      // Texto explicativo (segunda vez)
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("O financeiro descrito abaixo é referente a cada unidade separadamente.", 10, yPos);
      yPos += 8;

      // Segunda tabela de informações de pagamento (vazia)
      currentX = 10;
      pagHeaders.forEach((header, i) => {
        this.createTableCell(pdf, header, currentX, yPos, pagWidths[i], 8, 7, true);
        currentX += pagWidths[i];
      });
      yPos += 8;

      for (let i = 0; i < 5; i++) {
        currentX = 10;
        
        this.createTableCell(pdf, tiposPagamento[i], currentX, yPos, pagWidths[0], 8, 6);
        currentX += pagWidths[0];
        
        this.createTableCell(pdf, "", currentX, yPos, pagWidths[1], 8, 6);
        currentX += pagWidths[1];
        
        this.createTableCell(pdf, "", currentX, yPos, pagWidths[2], 8, 6);
        currentX += pagWidths[2];
        
        this.createTableCell(pdf, "", currentX, yPos, pagWidths[3], 8, 6);
        currentX += pagWidths[3];
        
        this.createTableCell(pdf, "", currentX, yPos, pagWidths[4], 8, 6);
        currentX += pagWidths[4];
        
        this.createTableCell(pdf, "", currentX, yPos, pagWidths[5], 8, 6);
        
        yPos += 8;
      }

      return pdf;
      
    } catch (error) {
      console.error('Erro ao gerar PDF de negociação:', error);
      throw new Error('Falha na geração do PDF de negociação');
    }
  }
}
