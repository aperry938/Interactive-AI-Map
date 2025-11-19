import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client dynamically
const getGenAI = () => {
    const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

export const generateInsight = async (conceptName: string, context: string = ""): Promise<string> => {
    const genAI = getGenAI();
    if (!genAI) {
        console.warn("Gemini API Key is missing.");
        return "Please add your Gemini API Key in Settings to generate insights.";
    }

    try {
        // Use the flash model for speed and higher rate limits
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Provide a concise, fascinating insight about "${conceptName}" in the context of Artificial Intelligence. 
    ${context ? `Context: ${context}` : ""}
    Keep it under 50 words and make it sound futuristic and engaging.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating insight:", error);
        return "Unable to generate insight at this moment.";
    }
};
