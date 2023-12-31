
import { createClient } from "@supabase/supabase-js";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { stripIndent } from "common-tags";
import { encode } from "gpt-tokenizer";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai-edge";

const supbaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabaseClient = createClient(supbaseUrl, supabaseKey);

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { prompt } = await req.json();
  const input = prompt.replace(/\n/g, " ");

  // extend some related keywords
  const extendKeywordCompletionResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: stripIndent`
        You are a AI assistant that helps people to find related sessions.
        Understand user prompt and come up with more related keywords for searching.
        Output as comma separated keywords in both English and 繁體中文 in the same line. Do not output duplicate keywords.
      `,
      },
      {
        role: "user",
        content: `
        Question: """
        ${prompt}
        """

        response as keywords:
      `,
      },
    ],
    temperature: 1,
  });

  const extendedKeywords = await extendKeywordCompletionResponse.json().then((json) => {
    console.log(json, "json");
    const { choices } = json;

    const keywords = choices?.[0].message?.content?.split(",") || [];

    return keywords || [];
  });

  // Generate a one-time embedding for the query itself
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: `${input} ${extendedKeywords.join(" ")}`,
  });

  const [{ embedding }] = (await embeddingResponse.json()).data;

  // Fetching whole documents for this simple example.
  //
  // Ideally for context injection, documents are chunked into
  // smaller sections at earlier pre-processing/embedding step.
  const { data: documents } = await supabaseClient.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.78, // Choose an appropriate threshold for your data
    match_count: 10, // Choose the number of matches
  });

  const documentIds = documents.map((doc: any) => doc.id as string);
  const sessionResponse = await supabaseClient.from("sessions").select("id,title,description").in("id", documentIds);

  // Limit to 10 sessions
  const sessions = (sessionResponse.data || []).slice(0, 10);

  console.log(sessions, "sessions");

  let tokenCount = 0;
  let contextText = "";

  // Concat matched documents
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];

    const content = `session_id: ${session.id}\n${session.title}\n---\n${session.description.slice(0, 500)}\n`;

    const tokens = encode(content);
    tokenCount += tokens.length;

    // Limit context to max 1500 tokens (configurable)
    // if (tokenCount > 2000) {
    //   break;
    // }

    contextText += `${content.trim()}\n===\n`;
  }

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: `
You are a very enthusiastic open source developer who loves
attending COSCUP conferences! Given the following sessions from the this year
COSCUP, recommend or answer questions about the sessions. Meet the following requirements:

- outputted in markdown format. 
- Based on the user prompt language(English, 中文, or others), response will always be in English or 臺灣繁體中文.
- The session is consist of https://coscup.org/2023/(zh-TW or en)/session/(SESSION_ID)
- DO NOT generate sessions not in the list given.
- Pick as many sessions from related sessions as possible
- The output format is as follows:

- [session title](link): (summarize session description, in english or 中文 based on user prompt language)
`,
    },
    {
      role: "assistant",
      content: `
      related sessions:
      ${contextText}
    `,
    },
    {
      role: "user",
      content: `
    Question: """
    ${prompt}
    """

    response as markdown:
  `,
    },
  ];

  // In production we should handle possible errors
  const completionResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    stream: true,
    temperature: 0, // Set to 0 for deterministic results
  });

  const stream = OpenAIStream(completionResponse);
  return new StreamingTextResponse(stream);
}
