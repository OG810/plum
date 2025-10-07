import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBvTnnQXLOXiuhDP9U50lZ7DjvRgFIHqqw" });

export const getImage = async (req, res) => {
    if (!req.file) return res.status(400).send({ error: "No file uploaded" });

    const filePath = req.file.path;
    const processedPath = `uploads/processed-${req.file.filename}`;
    const today = new Date().toISOString().split("T")[0];
    try {
        // Preprocess the image: grayscale + resize + sharpen
        await sharp(filePath)
            .grayscale()
            .sharpen()
            .resize({ width: 1000 })
            .toFile(processedPath);

        // Perform OCR
        const result = await Tesseract.recognize(
            processedPath,
            "eng",
            { logger: m => console.log(m) }
        );

        const words = result.data.words || []; // safe fallback
        const avgConfidence = words.length > 0
            ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
            : 0;

        const wordDetails = words.map(w => ({
            text: w.text,
            confidence: w.confidence.toFixed(2)
        }));

        // Cleanup processed file
        fs.unlinkSync(processedPath);
        
        const prompt = `
You are an intelligent assistant that extracts structured scheduling data from natural language messages.
... (your full prompt here) ...
User text: """${result.data.text || ""}""" and todays date is ${today} now if the appointment request is before the current date then needs_clarification
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
        console.error("OCR error:", error);
        res.status(500).send({ error: "OCR failed" });
    }
};
