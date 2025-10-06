import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBvTnnQXLOXiuhDP9U50lZ7DjvRgFIHqqw" });

export const getText = async (req, res) => {
  try {
    const userInput = req.body.text;
    const today = new Date().toISOString().split("T")[0];

    if (!userInput) {
      return res.status(400).json({
        status: "error",
        message: "Missing 'text' in request body",
      });
    }

    const prompt = `
You are an intelligent assistant that extracts structured scheduling data from natural language messages.
... (your full prompt here) ...
User text: """${userInput}""" and todays date is ${today} now if the appointment request is before the current date then needs_clarification
`;

    // Call the model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Extract the raw text from response
    const output = response.candidates[0].content.parts[0].text;

    // Extract JSON inside any ```json ... ``` block
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    let parsedOutput = {};

    if (jsonStart !== -1 && jsonEnd !== -1) {
      parsedOutput = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
    } else {
      // fallback if AI returned invalid JSON
      parsedOutput = {
        status: "needs_clarification",
        message: "Could not parse AI response",
      };
    }

    res.json(parsedOutput);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    });
  }
};
