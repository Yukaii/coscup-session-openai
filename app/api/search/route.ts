import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from "openai-edge";

import { createClient } from "@supabase/supabase-js";
import { encode } from "gpt-tokenizer";
import { stripIndent } from "common-tags";
import { OpenAIStream, StreamingTextResponse } from "ai";

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

  // Generate a one-time embedding for the query itself
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
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

  const documentIds = documents.map((document) => document.id);

  // const sessions = await supabaseClient.from("sessions").select("*").in("id", documentIds);

  let tokenCount = 0;
  let contextText = "";

  // Concat matched documents
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const content = document.content;
    const tokens = encode(content);
    tokenCount += tokens.length;

    // Limit context to max 1500 tokens (configurable)
    if (tokenCount > 1500) {
      break;
    }

    contextText += `${content.trim()}\n---\n`;
  }

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: stripIndent`
    You are a very enthusiastic open source developer who loves
    attending COSCUP conferences! Given the following sections from the this year
    COSCUP session list, answer the question using only that information,
    outputted in markdown format. If you are unsure and the answer
    is not explicitly written in the session, say

    "Sorry, I don't know how to help with that." or "抱歉，我找不到相關的訊息".
    Based on the user prompt language, response will be in either English or Tranditional Chinese.`,
    },
    {
      role: "assistant",
      content: `
      Context sections:
      ${contextText}
    `,
    },
    {
      role: "user",
      content: `
    Question: """
    ${prompt}
    """

    Answer as markdown:
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
