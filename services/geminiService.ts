
import { GoogleGenAI } from "@google/genai";
import { Product, Sale, Debt } from "../types";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBusinessInsights = async (data: {
  products: Product[];
  sales: Sale[];
  debts: Debt[];
  businessType: string;
}) => {
  try {
    const prompt = `
      Você é um consultor financeiro especialista em pequenos negócios informais (zungueiras, cantinas, barbeiros).
      Analise os seguintes dados do negócio "${data.businessType}":
      
      Produtos: ${JSON.stringify(data.products.map(p => ({ n: p.name, s: p.stock, p: p.price })))}
      Vendas recentes: ${JSON.stringify(data.sales.slice(-10).map(s => ({ n: s.productName, t: s.total })))}
      Dívidas pendentes: ${JSON.stringify(data.debts.filter(d => d.status === 'pending').map(d => ({ c: d.customerName, v: d.amount })))}
      
      Por favor, forneça 3 dicas práticas e curtas em português para melhorar o lucro ou gerir melhor o negócio. 
      Use uma linguagem simples e direta. Retorne em formato de lista Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    // Directly access the text property as per guidelines
    return response.text || "Não foi possível gerar dicas no momento. Continue vendendo bem!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao consultar o consultor IA. Verifique sua conexão.";
  }
};
