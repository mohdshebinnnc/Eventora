import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        if (!prompt || prompt.trim().length < 3) {
            return NextResponse.json(
                { error: "Please provide a more descriptive prompt" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const systemPrompt = `You are an AI event planning assistant for Eventora. Given a user's natural language description of an event, generate structured event details in JSON format.

Return ONLY valid JSON with these fields:
{
  "title": "A catchy, professional event title",
  "description": "A detailed 2-3 paragraph description of the event covering what attendees can expect, who should attend, and key highlights",
  "category": "One of: music, tech, business, sports, art, food, health, education",
  "tags": ["array", "of", "relevant", "tags", "max 5"],
  "locationType": "physical or online",
  "venueSuggestion": "A suggested venue name or type",
  "capacitySuggestion": number between 10 and 10000,
  "ticketType": "free or paid",
  "ticketPriceSuggestion": number or 0 if free
}

Be creative and professional. Make the description engaging and detailed.`;

        const result = await model.generateContent([
            systemPrompt,
            `Generate event details for: "${prompt}"`,
        ]);

        const responseText = result.response.text();
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const eventData = JSON.parse(jsonStr);

        return NextResponse.json(eventData);
    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json(
            { error: "Failed to generate event details. Please try again." },
            { status: 500 }
        );
    }
}
