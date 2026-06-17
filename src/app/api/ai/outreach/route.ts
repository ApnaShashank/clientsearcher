import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, lead, notes = "", senderName = "Brijesh Patel", senderCompany = "Localead Agency" } = body;

    if (!lead) {
      return NextResponse.json({ error: "Missing lead data" }, { status: 400 });
    }

    const openaiKey = serverState.customApiKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
    }

    let prompt = "";
    
    switch (type) {
      case "email":
        prompt = `Draft a highly compelling, personalized B2B cold email outreach sequence for the following business:
Business Name: ${lead.businessName}
Category: ${lead.category}
Rating: ${lead.rating} (${lead.reviewsCount} reviews)
Website: ${lead.website || "No Website"}
Phone: ${lead.phoneNumber}
Address: ${lead.address}
SEO Score: ${lead.seoScore}/100
Mobile Friendly: ${lead.mobileFriendly ? "Yes" : "No"}
SSL Enabled: ${lead.sslEnabled ? "Yes" : "No"}
Outreach Notes: ${notes}

Sender Name: ${senderName}
Sender Company: ${senderCompany}

Requirements:
- Make the email punchy, professional, and conversational.
- Target their exact weakness (e.g. if they have no website, offer a web design package; if they have low SEO score or no SSL, offer SEO audit; if they have poor ratings, offer reputation management).
- Keep it under 200 words.
- Suggest an attention-grabbing Subject Line.
- Do NOT use typical AI marketing fluff. Make it sound like a real human agency founder wrote it.`;
        break;
        
      case "whatsapp":
        prompt = `Write a short, engaging, and professional WhatsApp outreach message template for this business:
Business Name: ${lead.businessName}
Category: ${lead.category}
Website: ${lead.website || "None"}
SEO Details: Mobile friendly? ${lead.mobileFriendly ? "Yes" : "No"}, SSL? ${lead.sslEnabled ? "Yes" : "No"}
Outreach Notes: ${notes}

Sender Name: ${senderName}
Sender Company: ${senderCompany}

Requirements:
- Short (under 100 words), direct, and personalized.
- Must fit nicely in a mobile chat bubble.
- Concludes with a friendly, low-friction call-to-action question.`;
        break;

      case "proposal":
        prompt = `Generate a Tailored B2B Services Proposal draft for:
Business Name: ${lead.businessName}
Category: ${lead.category}
Website: ${lead.website || "None"}
SEO Rating: ${lead.seoScore}/100
Outreach Notes: ${notes}

Sender Name: ${senderName}
Sender Company: ${senderCompany}

Include these sections:
1. Executive Summary: The core business opportunity (website rebuild, Local SEO, lead gen).
2. Identified Areas for Improvement (based on ratings, SEO, website status).
3. Scope of Services & Deliverables.
4. Estimated Timeline & Pricing (realistic packages: $500 - $3000).
5. Call to Action.
Keep it elegant, structured, and highly convincing.`;
        break;

      case "followup":
        prompt = `Draft a friendly, short follow-up outreach message (for email or message) to be sent 4 days after our initial outreach to:
Business Name: ${lead.businessName}
Category: ${lead.category}
Outreach Notes: ${notes}

Sender Name: ${senderName}
Sender Company: ${senderCompany}

Keep it under 80 words. Focus on adding value, suggesting a quick 5-minute coffee call, and referencing our previous message about their online presence.`;
        break;

      case "analysis":
        prompt = `Perform a comprehensive, expert marketing and SEO audit for:
Business Name: ${lead.businessName}
Category: ${lead.category}
Rating: ${lead.rating} (${lead.reviewsCount} reviews)
Website: ${lead.website || "No Website"}
SEO Score: ${lead.seoScore}/100
Mobile Friendly: ${lead.mobileFriendly ? "Yes" : "No"}
SSL: ${lead.sslEnabled ? "Yes" : "No"}
Notes: ${notes}

Provide:
1. Technical Audit Summary (SSL, Mobile, PageSpeed estimation).
2. Local Search & GBP Review Sentiment Analysis (based on rating/reviews).
3. Primary Marketing Weakness.
4. Actionable 3-Step Growth Plan.
Output as a structured response.`;
        break;

      default:
        return NextResponse.json({ error: "Invalid type requested" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a professional B2B marketing consultant and veteran agency growth expert. You speak directly, avoid clichés, and provide highly polished copy." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    // Increment OpenAI key usage
    serverState.apiKeyUsage["OpenAI GPT-4o"] = (serverState.apiKeyUsage["OpenAI GPT-4o"] || 0) + 1;

    const aiData = await response.json();
    const result = aiData.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("AI Outreach API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI outreach" }, { status: 500 });
  }
}
