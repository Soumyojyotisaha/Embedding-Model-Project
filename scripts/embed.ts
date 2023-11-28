import { PGEssay, PGJSON } from "@/types";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import OpenAI from 'openai'; // Importing OpenAI from the updated package
loadEnvConfig("");

const generateEmbeddings = async (essays: PGEssay[]) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  for (let i = 0; i < essays.length; i++) {
    const section = essays[i];
    console.log('Processing section', i);

    // Create a single insertData array for the entire section
    const insertData = section.chunks.map((chunk) => ({
      essay_title: chunk.essay_title,
      essay_url: chunk.essay_url,
      essay_date: chunk.essay_date,
      content: chunk.content,
      content_tokens: chunk.content_tokens,
      embedding: null, // Placeholder for now, will be replaced below
    }));

    for (let j = 0; j < section.chunks.length; j++) {
      const chunk = section.chunks[j];
      console.log('Processing chunk', j);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk.content, // Fix: Use chunk.content instead of content
      });

      const [{ embedding }] = embeddingResponse.data;

      // Update the embedding in the insertData for this chunk
      // insertData[j].embedding = embedding;

      const { data, error } = await supabase
        .from('test_pg')
        .insert([insertData[j]])
        .select("*");

      if (error) {
        console.log('error');
      } else {
        console.log('saved', i, j);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

(async () => {
  const json: PGJSON = JSON.parse(fs.readFileSync('scripts/pg.json', 'utf8'))
  await generateEmbeddings(json.essays);
})();
