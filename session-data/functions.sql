create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    sessions.id,
    sessions.content,
    1 - (sessions.embedding <=> query_embedding) as similarity
  from sessions
  where 1 - (sessions.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;


create index on sessions using ivfflat (embedding vector_cosine_ops)
with
  (lists = 100);
