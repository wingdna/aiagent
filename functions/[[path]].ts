// functions/[[path]].ts
import { createPagesFunctionHandler } from "@react-router/cloudflare";

// @ts-ignore - 忽略构建前的类型报错
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (args: any) => {
    // 将 Cloudflare 的环境变量注入到 Loader Context 中
    return {
      env: args.context?.cloudflare?.env || args.env,
    };
  },
});
