
export interface TacticalModel {
    id: string;
    role: 'FAST_RESPONSE' | 'DEEP_THINKING' | 'STABLE_BACKUP' | 'LINGUISTIC_PRO' | 'HEAVY_ARMOR';
    description: string;
    isFree: boolean;
    failureCount: number;
    lastFailure: number;
}

export const MODEL_ROUTING_TABLE: TacticalModel[] = [
    { 
        id: "Qwen/Qwen2.5-7B-Instruct", 
        role: "FAST_RESPONSE", 
        description: "首发：毫秒级响应，JSON 强约束，处理基础指令",
        isFree: true,
        failureCount: 0,
        lastFailure: 0
    },
    { 
        id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", 
        role: "DEEP_THINKING", 
        description: "一补：长思考链，处理逻辑烧脑的复杂查询",
        isFree: true,
        failureCount: 0,
        lastFailure: 0
    },
    { 
        id: "Qwen/Qwen2.5-7B-Instruct", 
        role: "STABLE_BACKUP", 
        description: "二补：基石模型，作为通用对话的稳定性保障",
        isFree: true,
        failureCount: 0,
        lastFailure: 0
    },
    { 
        id: "THUDM/glm-4-9b-chat", 
        role: "LINGUISTIC_PRO", 
        description: "三补：语义增强，处理非标准化文本描述",
        isFree: true,
        failureCount: 0,
        lastFailure: 0
    },
    { 
        id: "Qwen/Qwen2.5-72B-Instruct", 
        role: "HEAVY_ARMOR", 
        description: "四补：重装坦克，处理逻辑死循环时的终极算力",
        isFree: true,
        failureCount: 0,
        lastFailure: 0
    }
];

export class TacticalRouter {
    private static instance: TacticalRouter;
    private models: TacticalModel[] = [...MODEL_ROUTING_TABLE];
    private COOLDOWN_MS = 60000; // 1 minute cooldown for failed models

    private constructor() {}

    public static getInstance(): TacticalRouter {
        if (!TacticalRouter.instance) {
            TacticalRouter.instance = new TacticalRouter();
        }
        return TacticalRouter.instance;
    }

    public getModelForIntent(intent: 'CHAT' | 'SEARCH' | 'COMPLEX'): TacticalModel {
        // Filter out models in cooldown
        const now = Date.now();
        const availableModels = this.models.filter(m => 
            m.failureCount < 3 || (now - m.lastFailure > this.COOLDOWN_MS)
        );

        if (availableModels.length === 0) {
            // Reset all if all failed (emergency reset)
            this.models.forEach(m => { m.failureCount = 0; m.lastFailure = 0; });
            return this.models[0];
        }

        // Logic for intent
        if (intent === 'COMPLEX') {
            const deep = availableModels.find(m => m.role === 'DEEP_THINKING');
            if (deep) return deep;
        }

        // Default to FAST_RESPONSE or first available
        return availableModels[0];
    }

    public reportFailure(modelId: string) {
        const model = this.models.find(m => m.id === modelId);
        if (model) {
            model.failureCount++;
            model.lastFailure = Date.now();
            console.warn(`[TacticalRouter] Model ${modelId} failed. Count: ${model.failureCount}`);
        }
    }

    public reportSuccess(modelId: string) {
        const model = this.models.find(m => m.id === modelId);
        if (model) {
            model.failureCount = 0;
            model.lastFailure = 0;
        }
    }
}
