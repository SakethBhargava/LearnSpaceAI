import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let messages: any[] = [];
    let file: File | null = null;

    // Handle both JSON and FormData requests safely
    if (contentType.includes("application/json")) {
      const jsonBody = await req.json();
      messages = jsonBody.messages || [];
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      const rawMessages = formData.get("messages") as string;
      if (rawMessages) {
        messages = JSON.parse(rawMessages);
      }
      file = formData.get("file") as File | null;
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type header" },
        { status: 400 },
      );
    }

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || "Hello";

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const imagePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      };
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return new Response(response.text());
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return new Response(response.text());
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI chat request" },
      { status: 500 },
    );
  }
}
