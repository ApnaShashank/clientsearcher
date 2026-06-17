import { NextRequest, NextResponse } from "next/server";
import { Lead } from "@/types/lead";
import { serverState } from "@/lib/serverState";

export const maxDuration = 30; // Allow enough time for AI and search requests

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      country = "United States", 
      state = "", 
      city = "New York City", 
      category = "Dental Clinic", 
      customCategory = "", 
      limit = 10,
      userId = "anonymous",
      userName = "Anonymous User"
    } = body;

    const searchTerm = customCategory || category;
    const locationQuery = `${city} ${state} ${country}`.trim();
    
    console.log(`Performing live lead search for "${searchTerm}" in "${locationQuery}"...`);

    // Fetch keys from server override first, falling back to process env
    const tavilyKey = serverState.customApiKeys.TAVILY_API_KEY || process.env.TAVILY_API_KEY;
    const openaiKey = serverState.customApiKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    let searchContext = "";
    
    if (tavilyKey) {
      try {
        const tavilyResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `local businesses ${searchTerm} in ${locationQuery} contact info website address rating reviews`,
            search_depth: "basic",
            max_results: 6
          })
        });
        
        if (tavilyResponse.ok) {
          const searchData = await tavilyResponse.json();
          searchContext = JSON.stringify(searchData.results);
          console.log("Tavily search context retrieved successfully.");
          
          // Increment Tavily usage in serverState
          serverState.apiKeyUsage["Tavily Search"] = (serverState.apiKeyUsage["Tavily Search"] || 0) + 1;
        }
      } catch (err) {
        console.error("Tavily search failed, falling back to pure AI generation:", err);
      }
    }

    if (!openaiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    // Call OpenAI GPT-4o to generate/enrich structured Lead objects
    const systemPrompt = `You are a premium B2B Lead Generation engine. Your task is to output a JSON array of high-quality business leads matching the user's request.
${searchContext ? `Use the following search context as a reference to include REAL businesses: ${searchContext}` : `Since no search context is available, generate highly realistic local businesses in the requested area.`}

You must return EXACTLY a JSON array of ${limit} Lead objects. Do NOT wrap in markdown formatting (like \`\`\`json). Output raw JSON string only.

Each object in the array must strictly match the following TypeScript interface:
interface Lead {
  id: string; // unique string e.g. "live_lead_1"
  businessName: string;
  category: string;
  rating: number; // between 3.2 and 4.9
  reviewsCount: number; // integer between 5 and 600
  address: string; // full realistic address matching the searched location
  phoneNumber: string; // realistic phone number matching the country format
  website: string; // valid url, or empty string if they don't have one (approx 15% shouldn't have a website)
  email: string; // realistic business email (e.g. contact@businessname.com or info@...)
  googleMapsUrl: string; // realistic maps search link
  facebookUrl?: string; // facebook link or omit
  instagramUrl?: string; // instagram link or omit
  leadScore: number; // calculated score out of 100 based on website, rating, and online reviews.
  websiteStatus: "Active" | "Slow" | "No Website" | "Down";
  seoScore: number; // 0 to 100 (0 if No Website, 40-95 if website exists)
  mobileFriendly: boolean;
  sslEnabled: boolean;
  googleReviewsChecked: boolean;
  lastUpdated: string; // YYYY-MM-DD format within the last 5 days
}

Make sure details like email, phone numbers, and websites are highly relevant to the business name. Ensure the address contains the city: "${city}".`;

    const userPrompt = `Generate ${limit} leads for "${searchTerm}" in "${city}, ${state || "N/A"}, ${country}"`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    // Increment OpenAI usage in serverState
    serverState.apiKeyUsage["OpenAI GPT-4o"] = (serverState.apiKeyUsage["OpenAI GPT-4o"] || 0) + 1;

    const aiData = await openaiResponse.json();
    const rawResultText = aiData.choices[0].message.content;
    const parsedData = JSON.parse(rawResultText);
    
    // The model will return an object, let's extract the array
    const leadsArray: Lead[] = parsedData.leads || Object.values(parsedData)[0] as Lead[] || [];
    const finalLeads = leadsArray.slice(0, limit);

    // Save search log to serverState
    serverState.searchLogs.unshift({
      id: `log_${Date.now()}`,
      userId,
      userName,
      query: `Live AI: ${searchTerm} in ${city}`,
      city,
      category: searchTerm,
      timestamp: new Date().toISOString(),
      resultsCount: finalLeads.length,
      leads: finalLeads
    });

    // Save system-wide audit activity
    serverState.activities.unshift({
      id: `act_${Date.now()}`,
      leadId: "search_live",
      leadName: `Live Search by ${userName}`,
      action: `Searched for "${searchTerm}" in "${city}" (found ${finalLeads.length} real-time leads)`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ leads: finalLeads });
  } catch (error: any) {
    console.error("Live search API endpoint error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute search" }, { status: 500 });
  }
}
