import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Please set GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MANUAL_PATH = path.join(process.cwd(), 'src/data/manual.txt');

async function fetchDocumentation(query) {
  console.log(`Starting documentation sync for: ${query}`);

  const prompt = `
    I need official Cadence SKILL documentation for functions matching: "${query}".
    Please provide at least 20 common Cadence SKILL functions (prefix like db, le, ge, hi, or standard Lisp ones like car, cdr).
    Format EACH function EXACTLY like this (ensure each tag is on a NEW LINE):
    
    @function functionName
    @usage functionUsage(...)
    @category CategoryName
    @parameters
    param1: description
    param2: description
    @example
    functionName(...) ; comment
    @desc Full description.
    
    Ensure there is an EMPTY LINE between different functions.
    Ensure EACH @ tag starts on its own new line.
    Ensure the output is pure text that I can append to a manual.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    let text = response.text;
    // Post-process to ensure @ tags are on new lines if the model missed some
    text = text.replace(/([^\n])@/g, '$1\n@');
    return text;
  } catch (err) {
    console.error("Error generating documentation:", err);
    return "";
  }
}

async function main() {
  const query = process.argv[2] || "standard core functions";
  const newDocs = await fetchDocumentation(query);
  
  if (newDocs) {
    fs.appendFileSync(MANUAL_PATH, "\n\n" + newDocs);
    console.log(`Successfully updated manual.txt with new documentation for ${query}.`);
  }
}

main();
