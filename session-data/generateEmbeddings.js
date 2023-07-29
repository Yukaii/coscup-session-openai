const { createClient } = require("@supabase/supabase-js");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function getDocuments() {
  return supabaseClient
    .from("sessions")
    .select("*")
    .then(({ data }) => data);
}

async function generateEmbeddings() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openAi = new OpenAIApi(configuration);

  const documents = await getDocuments(); // Your custom function to load docs

  let count = 0;

  // Assuming each document is a string
  for (const document of documents) {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = document.content.replace(/\n/g, " ");

    const embeddingResponse = await openAi.createEmbedding({
      model: "text-embedding-ada-002",
      input,
    });

    const [{ embedding }] = embeddingResponse.data.data;

    // In production we should handle possible errors
    try {
      const { error } = await supabaseClient
        .from("sessions")
        .update({
          // content: document.content,
          embedding,
        })
        .eq("id", document.id);

      console.log("updated", document.id);

      if (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }

    count++;
    console.log(
      `Generated embedding for document ${count} of ${documents.length}`,
    );
  }

  console.log("Done!");
}

generateEmbeddings();
