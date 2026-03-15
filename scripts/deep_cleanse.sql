-- 部署协议：代号[DEEP_CLEANSE-DB]
-- 目标：Supabase PostgreSQL agents 表
-- 任务：Schema 修复 + 数据清洗

BEGIN;

-- 1. Schema Fix & Migration (处理 JSONB -> Text 转换)
DO $$
BEGIN
    -- 检测 pricing_model 是否为 JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'pricing_model' AND data_type = 'jsonb') THEN
        RAISE NOTICE 'Detected pricing_model as JSONB. Migrating to TEXT...';
        
        -- 重命名旧列
        ALTER TABLE agents RENAME COLUMN pricing_model TO pricing_model_json;
        
        -- 创建新列
        ALTER TABLE agents ADD COLUMN pricing_model text;
        ALTER TABLE agents ADD COLUMN pricing_details text;
        
        -- 数据迁移 (从 JSONB 提取)
        -- 假设 JSON 结构: { "type": "Open-Weights", "currency": "USD", ... }
        UPDATE agents 
        SET pricing_model = pricing_model_json->>'type',
            pricing_details = NULL; -- 暂时置空，或者从其他字段提取
            
        RAISE NOTICE 'Migration complete. Old column renamed to pricing_model_json.';
    ELSE
        RAISE NOTICE 'pricing_model is not JSONB. Skipping migration.';
    END IF;

    -- 确保 pricing_details 存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'pricing_details') THEN
        ALTER TABLE agents ADD COLUMN pricing_details text;
        RAISE NOTICE 'Created pricing_details column.';
    END IF;
END $$;

-- 2. Data Cleansing (The Alchemist Logic)

-- A. Strict Enum Coercion (强类型价格枚举约束)
-- 归一化 (Normalization)
UPDATE agents SET pricing_model = 'Free' WHERE pricing_model ILIKE 'free';
UPDATE agents SET pricing_model = 'Freemium' WHERE pricing_model ILIKE 'freemium' OR pricing_model ILIKE 'free trial';
UPDATE agents SET pricing_model = 'Subscription' WHERE pricing_model ILIKE 'subscription' OR pricing_model ILIKE 'paid' OR pricing_model ILIKE 'enterprise' OR pricing_model ILIKE 'contact%';
UPDATE agents SET pricing_model = 'API' WHERE pricing_model ILIKE 'api' OR pricing_model ILIKE 'usage%';
UPDATE agents SET pricing_model = 'Open Source' WHERE pricing_model ILIKE 'open source' OR pricing_model ILIKE 'open-weights' OR pricing_model ILIKE 'opensource';

-- 清除无效值 (Set invalid to NULL)
UPDATE agents 
SET pricing_model = NULL 
WHERE pricing_model NOT IN ('Free', 'Freemium', 'Subscription', 'API', 'Open Source');

-- B. Hallucination Purge (幻觉数据歼灭)
-- 游离数值拦截 (Loose numbers)
UPDATE agents 
SET pricing_details = NULL 
WHERE pricing_details ~ '^\d+(\.\d+)?$';

-- 无意义占位符肃清 (Placeholders)
-- 如果 pricing_details 包含占位符，且 pricing_model 为空或 Free，则推断为 Subscription
UPDATE agents 
SET pricing_model = COALESCE(pricing_model, 'Subscription')
WHERE pricing_details ~* '(TBD|Contact for pricing|N/A|Let''s talk)';

-- 清空占位符文本
UPDATE agents 
SET pricing_details = NULL 
WHERE pricing_details ~* '(TBD|Contact for pricing|N/A|Let''s talk)';

-- LLM 幻觉识别 (LLM Refusals)
UPDATE agents 
SET pricing_details = NULL 
WHERE length(pricing_details) > 300 
  AND pricing_details ~* '(As an AI|I cannot determine|I am an AI|I do not have access)';

COMMIT;
