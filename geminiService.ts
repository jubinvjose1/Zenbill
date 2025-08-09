import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Sale } from '../types.ts';

// Define a simple type for chat history messages
type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getAiChatResponse = async (
  userInput: string,
  history: ChatMessage[],
  sales: Sale[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  if (sales.length === 0 && history.length === 0) {
      return "I'm ready to help you with business insights, but you don't have any sales data yet. Once you make some sales, I can analyze them for you. For now, feel free to ask me general business questions!";
  }

  const simplifiedSales = sales.map(sale => ({
    total: sale.total,
    date: sale.date,
    itemCount: sale.items.reduce((acc, item) => acc + item.quantity, 0),
    items: sale.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
  }));

  const systemInstruction = `
    You are Zen, a friendly and helpful business analyst for a small retail shop.
    Your personality is encouraging and insightful.
    You will be given the shop's sales data.
    Analyze the data to answer the user's questions. Provide concise, clear, and actionable insights.
    If a user asks a question you cannot answer with the given data, politely explain what data you need.
    The current date is ${new Date().toLocaleDateString()}.
    The sales data is in this format: ${JSON.stringify(simplifiedSales[0] || {})}
    
    Here is the complete sales data for your analysis:
    ${JSON.stringify(simplifiedSales)}
  `;

  try {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
        history: history
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message: userInput });
    return response.text;
  } catch (error) {
    console.error("Error generating AI chat response:", error);
    throw new Error("Failed to get a response from the AI analyst. The model may be busy. Please try again in a moment.");
  }
};