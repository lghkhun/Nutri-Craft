import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Dynamic configuration to ensure API runs dynamically
export const dynamic = "force-dynamic";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export async function POST(req: NextRequest) {
  try {
    const client = getGeminiClient();
    const body = await req.json();
    const { action, prompt, history, characterName, health, energy, choicesLog } = body;

    if (!client) {
      // Graceful fallback response when GEMINI_API_KEY is not configured
      return NextResponse.json({
        success: true,
        text: "Fitur AI saat ini menggunakan mode simulasi cerdas karena kunci API belum diatur. Tetaplah memilih makanan gizi seimbang!",
        fallback: true
      });
    }

    if (action === "chat") {
      // Kamus Nutrisi Chat Assistant
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt || "Halo! Apa kabar?",
        config: {
          systemInstruction: "Anda adalah 'dr. Nutri', dokter virtual ramah dan seru dalam game edukasi 'Nutri Craft'. Target audiens Anda adalah anak remaja sekolah menengah (SMP). Jawablah pertanyaan mereka seputar kesehatan, kalori, serat, anemia, zat besi, gizi seimbang 'Isi Piringku', bahaya junk food berlebih, dan asupan gula garam lemak (GGL). Gunakan bahasa gaul remaja yang santun, energetik, suportif, bersahabat, dibumbui sedikit analogi kreatif yang mudah dipahami remaja. Batasi jawaban maksimal 2-3 paragraf agar tidak membosankan.",
          temperature: 0.7,
        }
      });
      return NextResponse.json({ success: true, text: response.text });
    } 
    
    if (action === "evaluate") {
      // Game-end personalized evaluation
      const summaryLog = JSON.stringify(choicesLog);
      const systemInstruction = 
        "Anda adalah 'dr. Nutri', ahli gizi & dokter virtual untuk game 'Nutri Craft'. " +
        "Tugas Anda adalah menerima riwayat makanan pemain selama 7 hari, lalu memberikan evaluasi gizi akhir yang mendalam, mendidik, dan sangat bersahabat bagi remaja SMP. " +
        "Sebutkan dampak baik dari makanan sehat yang mereka pilih, dan beri koreksi mendidik bersahabat atas makanan tidak sehat (seperti mi instan, gorengan berlebih, soda, boba) yang mereka pilih selama simulasi. " +
        "Sebutkan konsep 'Isi Piringku' (karbohidrat, protein, sayuran, buah-buahan) dan pedoman konsumsi Gula Garam Lemak (GGL) Kemenkes RI. " +
        "Sambungkan dengan kebiasaan remaja saat belajar (gampang mengantuk, sulit konsentrasi, anemia karena kurang zat besi, atau metabolisme). " +
        "Berikan penutup yang memotivasi mereka untuk menerapkan hidup sehat di dunia nyata. " +
        "Batasi panjang jawaban agar elok dibaca remaja SMP (maksimal 3 paragraf pendek atau poin-poin yang asyik).";

      const userMessage = `Nama Karakter: ${characterName || "Budi"}.
Sisa Health Akhir: ${health || 100}%.
Sisa Energy Akhir: ${energy || 100}%.
Riwayat hidangan harian yang dipilih pemain: ${summaryLog}.
Beri analisis gizi mendidik.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        }
      });
      return NextResponse.json({ success: true, text: response.text });
    }

    return NextResponse.json({ success: false, error: "Tindakan (action) tidak dikenal." }, { status: 400 });
  } catch (error: any) {
    console.error("Kesalahan API Route Gemini:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Terjadi kesalahan internal." 
    }, { status: 500 });
  }
}
