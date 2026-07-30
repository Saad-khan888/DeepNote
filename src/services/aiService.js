// AI Service using Groq API
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call Groq AI API
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - System instructions
 * @param {number} maxTokens - Maximum tokens to generate
 * @returns {Promise<string>} - AI response
 */
export const callGroqAI = async (prompt, systemPrompt = '', maxTokens = 2048) => {
  try {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AI request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
};

/**
 * Summarize note content
 */
export const summarizeNote = async (content) => {
  const systemPrompt = `You are an expert at creating concise, structured summaries. Create a summary in bullet point format. Use 3-5 bullet points maximum. Each bullet point should be a complete sentence capturing a key idea or takeaway. Start each bullet point with "• " (bullet character followed by space). Return ONLY the bullet points without any introduction, title, or additional text.`;
  const prompt = `Create a bullet point summary of the following text:\n\n${content}`;
  const result = await callGroqAI(prompt, systemPrompt, 500);
  
  // Ensure bullet points format
  let cleaned = result.trim();
  
  // If AI didn't use bullets, add them
  if (!cleaned.includes('•') && !cleaned.includes('*') && !cleaned.includes('-')) {
    // Split by newlines and add bullets
    const lines = cleaned.split('\n').filter(line => line.trim());
    cleaned = lines.map(line => `• ${line.trim()}`).join('\n');
  } else {
    // Normalize bullet characters to •
    cleaned = cleaned.replace(/^[\*\-]\s/gm, '• ');
  }
  
  return cleaned;
};

/**
 * Generate title from content
 */
export const generateTitle = async (content) => {
  const systemPrompt = `You are an expert at creating clear, descriptive titles. Analyze the content and generate a concise, informative title that captures the main topic or purpose. Rules:
- Maximum 8 words
- Be specific and descriptive
- Use title case (capitalize main words)
- No punctuation at the end
- No quotes around the title
- Return ONLY the title, nothing else`;
  
  const prompt = `Based on this content, generate a short, descriptive title:\n\n${content}`;
  const result = await callGroqAI(prompt, systemPrompt, 100);
  
  // Clean up the result
  let cleaned = result.trim();
  
  // Remove surrounding quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove "Title: " prefix if AI added it
  cleaned = cleaned.replace(/^(Title:\s*)/i, '');
  
  // Remove trailing period if present
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }
  
  return cleaned.trim();
};

/**
 * Rewrite content for clarity
 */
export const rewriteForClarity = async (content) => {
  const systemPrompt = `You are an expert writing coach specializing in clarity and readability. Your task:
- Rewrite the text to be clearer and easier to understand
- Fix awkward phrasing and confusing sentences
- Break up long, complex sentences
- Use simpler words when appropriate
- Improve logical flow between ideas
- Preserve the original meaning, tone, and voice
- Keep the same approximate length
- Return ONLY the rewritten text`;
  
  const prompt = `Rewrite this text for better clarity and readability:\n\n${content}`;
  const result = await callGroqAI(prompt, systemPrompt, 2048);
  return result.trim();
};

/**
 * Rephrase content with specific style
 * @param {string} content - Content to rephrase
 * @param {string} style - Style: 'professional', 'formal', 'shorter', 'friendly', 'academic', 'fix-grammar'
 */
export const rephraseContent = async (content, style) => {
  const styleInstructions = {
    professional: {
      system: 'You are an expert business communication specialist. Rephrase the text in a professional, confident business tone.',
      instruction: 'Transform this into professional business language. Use clear, direct communication. Sound confident and competent. Avoid casual language. Use active voice. Keep it concise but authoritative. Example: "We need to discuss this" becomes "Let\'s schedule a discussion to address this matter."'
    },
    formal: {
      system: 'You are an expert in formal writing. Rephrase the text in a polished, formal tone suitable for official documents, academic papers, or professional correspondence.',
      instruction: 'Rewrite this in formal, elevated language. Use sophisticated vocabulary. Write in third person where appropriate. Avoid contractions. Use complete sentences. Sound diplomatic and respectful. Example: "I think we should do this" becomes "It is recommended that this course of action be pursued."'
    },
    shorter: {
      system: 'You are an expert editor who specializes in concise writing. Make the text significantly shorter while preserving all key information.',
      instruction: 'Reduce this text by at least 30-40%. Remove redundancy, filler words, and unnecessary details. Keep only essential information. Use shorter sentences. Be direct and punchy. Every word must earn its place. Example: "In order to achieve the goal, we need to work together" becomes "To achieve this goal, we must collaborate."'
    },
    friendly: {
      system: 'You are an expert in warm, conversational writing. Rephrase the text in a friendly, approachable tone that feels personal and engaging.',
      instruction: 'Rewrite this to sound warm, friendly, and conversational. Use contractions. Add conversational phrases. Sound like you\'re talking to a friend. Be enthusiastic and positive. Use simple, everyday language. Example: "We must complete this task" becomes "Hey! Let\'s get this done together."'
    },
    academic: {
      system: 'You are an expert academic writer. Rephrase the text in scholarly, precise language suitable for research papers and academic publications.',
      instruction: 'Transform this into academic prose. Use precise terminology. Cite logical relationships. Write objectively in third person. Use complex sentence structures appropriately. Sound authoritative and well-researched. Example: "This shows that it works" becomes "The evidence demonstrates the efficacy of this approach."'
    },
    'fix-grammar': {
      system: 'You are an expert proofreader and grammar specialist. Fix all grammar, spelling, punctuation, and sentence structure errors while preserving the original meaning and tone.',
      instruction: 'Correct all errors: spelling, grammar, punctuation, capitalization, sentence fragments, run-ons, subject-verb agreement, tense consistency, word choice. Improve clarity only if grammatically necessary. Preserve the author\'s voice, tone, and style. Return ONLY the corrected text.'
    }
  };

  const config = styleInstructions[style] || {
    system: 'You are a helpful writing assistant.',
    instruction: 'Rephrase the following text.'
  };

  const systemPrompt = `${config.system} ${config.instruction} Return ONLY the rephrased text without any introduction, explanation, or commentary.`;
  
  const prompt = content;
  
  const result = await callGroqAI(prompt, systemPrompt, 2048);
  
  // Clean up the result - remove any quotes or extra text the AI might add
  let cleaned = result.trim();
  
  // Remove surrounding quotes if AI added them
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  return cleaned;
};

/**
 * Expand ideas in content
 */
export const expandIdeas = async (content) => {
  const systemPrompt = `You are an expert at developing and expanding ideas comprehensively. Your task:
- Take the provided text and elaborate on it significantly
- Add relevant details, examples, and supporting information
- Develop each point more fully
- Maintain the original tone and style
- Make it 2-3 times longer than the original
- Keep the same structure and flow
- Return ONLY the expanded text`;
  
  const prompt = `Expand on these ideas with more detail, examples, and depth:\n\n${content}`;
  const result = await callGroqAI(prompt, systemPrompt, 2048);
  return result.trim();
};

/**
 * Semantic search simulation (for future implementation)
 */
export const semanticSearch = async (query, notes) => {
  // This would require embeddings API
  // For now, return a placeholder
  console.log('Semantic search not yet implemented');
  return [];
};

/**
 * AI-powered semantic search for notes
 * Uses AI to understand user intent and match notes semantically
 */
export const semanticSearchNotes = async (userQuery, allNotes) => {
  try {
    // Create a comprehensive context of all notes for the AI
    const notesContext = allNotes.map((note, index) => {
      // Extract text content from HTML
      const div = document.createElement('div');
      div.innerHTML = note.content || '';
      const textContent = div.textContent || div.innerText || '';
      
      // Create a structured representation
      return {
        index: index,
        id: note.id,
        title: note.title || 'Untitled',
        content: textContent.substring(0, 500), // First 500 chars
        tags: note.tags || [],
        createdAt: note.createdAt?.toDate ? note.createdAt.toDate().toISOString() : new Date(note.createdAt).toISOString(),
        folder: note.folder || 'none'
      };
    }).slice(0, 50); // Limit to 50 most recent notes to avoid token limits

    const systemPrompt = `You are an intelligent note search assistant. Your task is to analyze the user's search query and find the most relevant notes from their collection.

Rules:
1. Understand the USER'S INTENT, not just keyword matching
2. Consider semantic meaning (e.g., "AI class" matches "Artificial Intelligence course")
3. Consider time references (e.g., "last month" looks at creation dates)
4. Consider context clues (e.g., "university", "semester", "work" help identify note type)
5. Return the indices of matching notes in order of relevance (most relevant first)
6. Return ONLY a JSON array of numbers (indices), nothing else
7. If no matches found, return an empty array []

Examples:
- Query: "my classes last month" → Look for notes created last month about classes/courses
- Query: "AI work" → Look for notes about Artificial Intelligence, AI projects, AI assignments
- Query: "7th semester subjects" → Look for notes mentioning 7th semester or specific courses
- Query: "project ideas" → Look for notes about projects, ideas, brainstorming`;

    const userPrompt = `User Query: "${userQuery}"

Available Notes (with indices):
${JSON.stringify(notesContext, null, 2)}

Return a JSON array of note indices that match this query, ordered by relevance. Example: [5, 12, 3]`;

    const result = await callGroqAI(userPrompt, systemPrompt, 1000);
    
    // Parse the AI response to extract indices
    let indices = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = result.match(/\[([\d,\s]+)\]/);
      if (jsonMatch) {
        indices = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole response
        indices = JSON.parse(result.trim());
      }
      
      // Validate that indices are numbers and within range
      indices = indices.filter(idx => 
        typeof idx === 'number' && 
        idx >= 0 && 
        idx < allNotes.length
      );
    } catch (error) {
      console.error('Error parsing AI search results:', error);
      return [];
    }

    // Return the matching notes in order of relevance
    return indices.map(idx => allNotes[idx]);
    
  } catch (error) {
    console.error('Semantic search error:', error);
    throw error;
  }
};
