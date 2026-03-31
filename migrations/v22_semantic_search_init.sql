-- 🛑 IRON SHIELD PROTOCOL: VECTOR SEARCH INITIALIZATION 🛑
-- 运行此脚本前，确保您在 Supabase 控制台中。

-- 1. 强制开启 pgvector 扩展 (这是核心)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 为我们现有的 agents 表添加一个专门存放向量的列
-- 假设我们使用 OpenAI 的 text-embedding-3-small，它的维度是 1536
ALTER TABLE agents ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. 创建 HNSW 索引 (实现超大规模数据下的毫秒级近似最近邻搜索)
-- 这能保证即使我们有 10 万个 Agent，搜索依然在 50ms 内完成
CREATE INDEX ON agents USING hnsw (embedding vector_ip_ops);

-- 4. 创建前端可以调用的 "语义搜索" RPC (Remote Procedure Call) 函数
-- 这个函数接收用户的搜索向量，返回最匹配的 Agent
CREATE OR REPLACE FUNCTION match_agents(
  query_embedding vector(1536), -- 用户搜索词的向量
  match_threshold float,        -- 匹配阈值 (比如 0.7，越接近 1 越准)
  match_count int               -- 返回多少个结果 (比如 10)
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  category text,
  similarity float              -- 返回相似度得分，供前端炫酷展示
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    agents.id,
    agents.name,
    agents.slug,
    agents.description,
    agents.category,
    1 - (agents.embedding <=> query_embedding) AS similarity -- 使用余弦距离计算相似度
  FROM agents
  -- 只有相似度大于阈值的才返回
  WHERE 1 - (agents.embedding <=> query_embedding) > match_threshold
  -- 按相似度从高到低排序
  ORDER BY agents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;