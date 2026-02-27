import os

def hunt_seeds():
    print("___ YOUAGENT SEED HUNTER v3.0 [MANUAL SKYNET MODE] ___")
    print("[*] STRATEGY CHANGE: Injecting curated list of 200+ Next-Gen Agents.")
    
    # === 2026-READY AGENT INDEX ===
    # A curated list of the most advanced AI Agents, Frameworks, and Tools.
    seeds = [
        # --- TIER 0: THE GIANTS ---
        "https://openai.com",
        "https://www.anthropic.com",
        "https://gemini.google.com",
        "https://deepmind.google",
        "https://www.midjourney.com",
        "https://runwayml.com",
        "https://stability.ai",
        "https://mistral.ai",
        "https://cohere.com",
        "https://www.meta.ai",

        # --- TIER 1: AUTONOMOUS AGENTS (GITHUB) ---
        "https://github.com/Significant-Gravitas/AutoGPT",
        "https://github.com/joaomdmoura/crewAI",
        "https://github.com/geekan/MetaGPT",
        "https://github.com/OpenDevin/OpenDevin",
        "https://github.com/princeton-nlp/SWE-agent",
        "https://github.com/OpenBMB/ChatDev",
        "https://github.com/KillianLucas/open-interpreter",
        "https://github.com/AntonOsika/gpt-engineer",
        "https://github.com/yoheinakajima/babyagi",
        "https://github.com/reworkd/AgentGPT",
        "https://github.com/TransformerOptimus/SuperAGI",
        "https://github.com/MineDojo/Voyager",
        "https://github.com/camel-ai/camel",
        "https://github.com/joonspk-research/generative_agents",
        "https://github.com/zhayujie/chatgpt-on-wechat",
        "https://github.com/danny-avila/LibreChat",
        "https://github.com/lobehub/lobe-chat",
        
        # --- TIER 2: AGENT FRAMEWORKS & ORCHESTRATION ---
        "https://github.com/langchain-ai/langchain",
        "https://github.com/microsoft/autogen",
        "https://github.com/run-llama/llama_index",
        "https://github.com/microsoft/Semantic-Kernel",
        "https://github.com/microsoft/TaskWeaver",
        "https://github.com/guidance-ai/guidance",
        "https://github.com/langflow-ai/langflow",
        "https://github.com/FlowiseAI/Flowise",
        "https://github.com/tensorchord/envd",
        "https://github.com/ironclad/rivet",
        "https://github.com/langgenius/dify",
        "https://github.com/labring/FastGPT",
        "https://github.com/stanfordnlp/dspy",
        "https://github.com/pydantic/pydantic",
        "https://github.com/dagster-io/dagster",
        "https://github.com/PrefectHQ/prefect",
        "https://github.com/ray-project/ray",
        
        # --- TIER 3: CODING & DEV AGENTS ---
        "https://github.com/features/copilot",
        "https://cursor.com",
        "https://aider.chat",
        "https://github.com/paul-gauthier/aider",
        "https://www.cognition.ai",
        "https://github.com/continuedev/continue",
        "https://github.com/Exafunction/codeium",
        "https://github.com/TabbyML/tabby",
        "https://github.com/sourcegraph/cody",
        "https://github.com/stitionai/devika",
        "https://github.com/Pythagora-io/gpt-pilot",
        "https://github.com/wasp-lang/wasp",
        "https://github.com/reflex-dev/reflex",
        "https://github.com/streamlit/streamlit",
        "https://github.com/gradio-app/gradio",
        "https://github.com/Chainlit/chainlit",

        # --- TIER 4: LOCAL LLM & INFERENCE ---
        "https://github.com/ollama/ollama",
        "https://github.com/lm-sys/FastChat",
        "https://github.com/nomic-ai/gpt4all",
        "https://github.com/oobabooga/text-generation-webui",
        "https://github.com/janhq/jan",
        "https://lmstudio.ai",
        "https://github.com/ggerganov/llama.cpp",
        "https://github.com/ggerganov/whisper.cpp",
        "https://github.com/vllm-project/vllm",
        "https://github.com/huggingface/text-generation-inference",
        "https://github.com/NVIDIA/TensorRT-LLM",
        "https://github.com/sgl-project/sglang",
        "https://github.com/ModelTC/lightllm",
        "https://github.com/exo-explore/exo",
        "https://github.com/mlc-ai/mlc-llm",
        "https://github.com/Mozilla-Ocho/llamafile",
        "https://github.com/mudler/LocalAI",
        "https://github.com/MustafaBaber/Ollama-GUI",

        # --- TIER 5: MEMORY & VECTOR DATABASES ---
        "https://github.com/chroma-core/chroma",
        "https://github.com/milvus-io/milvus",
        "https://github.com/qdrant/qdrant",
        "https://github.com/weaviate/weaviate",
        "https://github.com/pinecone-io/pinecone-python-client",
        "https://github.com/facebookresearch/faiss",
        "https://github.com/jina-ai/jina",
        "https://github.com/docarray/docarray",
        "https://github.com/pgvector/pgvector",
        "https://github.com/lance-db/lancedb",
        "https://github.com/zilliztech/gptcache",
        "https://github.com/mem0ai/mem0",
        "https://github.com/cpacker/MemGPT",
        "https://github.com/StanGirard/quivr",

        # --- TIER 6: RESEARCH & SEARCH AGENTS ---
        "https://www.perplexity.ai",
        "https://you.com",
        "https://consensus.app",
        "https://elicit.com",
        "https://tavily.com",
        "https://serper.dev",
        "https://exa.ai",
        "https://github.com/searxng/searxng",
        "https://github.com/mendableai/firecrawl",
        "https://github.com/unclecode/crawl4ai",
        "https://github.com/VinciGit00/Scrapegraph-ai",
        "https://github.com/spider-one/spider",
        "https://github.com/AgentQL/agentql",
        "https://github.com/multion-ai/multion",

        # --- TIER 7: IMAGE & VIDEO GENERATION ---
        "https://github.com/comfyanonymous/ComfyUI",
        "https://github.com/lllyasviel/Fooocus",
        "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
        "https://github.com/invoke-ai/InvokeAI",
        "https://github.com/bmaltais/kohya_ss",
        "https://github.com/Mikubill/sd-webui-controlnet",
        "https://github.com/lucidrains/imagen-pytorch",
        "https://github.com/CompVis/stable-diffusion",
        "https://github.com/Stability-AI/generative-models",
        "https://github.com/black-forest-labs/flux",
        "https://github.com/THUDM/CogVideo",
        "https://github.com/hpcaitech/Open-Sora",
        "https://github.com/Vchitect/Latte",
        "https://github.com/MooreThreads/Moore-AnimateAnyone",
        "https://github.com/fudan-generative-vision/champ",
        "https://github.com/TencentAI4Games/MuseTalk",
        "https://github.com/OpenTalker/SadTalker",
        "https://github.com/Rudrabha/Wav2Lip",
        "https://github.com/KwaiVGI/LivePortrait",
        "https://github.com/bytedance/X-Portrait",

        # --- TIER 8: VOICE & AUDIO AGENTS ---
        "https://github.com/suno-ai/bark",
        "https://github.com/Plachtaa/VALL-E-X",
        "https://github.com/facebookresearch/audiocraft",
        "https://github.com/Stability-AI/stable-audio-tools",
        "https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI",
        "https://github.com/myshell-ai/OpenVoice",
        "https://github.com/coqui-ai/TTS",
        "https://github.com/rhasspy/piper",
        "https://github.com/openai/whisper",
        
        # --- TIER 9: HARDWARE & WEARABLES (Future) ---
        "https://www.rabbit.tech",
        "https://hu.ma.ne",
        "https://www.brilliant.xyz",
        "https://www.tab.us",
        "https://www.limitless.ai",
        "https://www.plaud.ai",
        
        # --- TIER 10: OPEN SOURCE MODELS (Weights) ---
        "https://huggingface.co/meta-llama/Meta-Llama-3-70B",
        "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1",
        "https://huggingface.co/Qwen/Qwen2-72B",
        "https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2",
        "https://huggingface.co/google/gemma-2-27b",
        "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct",
        "https://huggingface.co/01-ai/Yi-1.5-34B",
        "https://huggingface.co/CohereForAI/c4ai-command-r-plus",
        "https://huggingface.co/databricks/dbrx-instruct",
        "https://huggingface.co/Snowflake/snowflake-arctic-instruct",
        
        # --- TIER 11: EVALUATION & BENCHMARKS ---
        "https://github.com/open-compass/opencompass",
        "https://github.com/haonan-li/CMMLU",
        "https://github.com/hendrycks/test",
        "https://github.com/openai/evals",
        "https://github.com/explodinggradients/ragas",
        "https://github.com/arize-ai/phoenix",
        "https://github.com/truera/trulens",
        
        # --- TIER 12: MISC & UTILITIES ---
        "https://github.com/vercel/ai",
        "https://github.com/steven-tey/dub",
        "https://github.com/transodyssey/Agentargo",
        "https://github.com/logspace-ai/langflow",
        "https://github.com/fixie-ai/ai-jsx",
        "https://github.com/steamship-packages/langchain",
        "https://github.com/magick-technologies/magick",
        "https://zapier.com/ai",
        "https://www.make.com",
        "https://www.bardeen.ai"
    ]

    output_file = 'seeds.txt'
    
    # 去重并排序
    unique_seeds = sorted(list(set(seeds)))
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for url in unique_seeds:
                f.write(url + '\n')
        
        print(f"\n[SUCCESS] SKYNET INJECTION COMPLETE.")
        print(f"[*] Payload: {len(unique_seeds)} high-value targets locked.")
        print(f"[*] Database Path: {os.path.abspath(output_file)}")
        print(f"[*] Next Step: Run 'python mass_harvester.py' to consume data.")
        
    except Exception as e:
        print(f"[!] File write error: {e}")

if __name__ == "__main__":
    hunt_seeds()
