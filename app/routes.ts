import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  layout("./routes/layout.tsx", [
    index("./routes/_index.tsx"),
    route("agent/:slug", "./routes/agent.$slug.tsx"),
    route("battle", "./routes/battle.tsx"),
    route("workflow", "./routes/workflow.tsx"),
    route("rankings", "./routes/rankings.tsx"),
    route("directory", "./routes/directory.tsx"),
    route("blog", "./routes/blog.tsx"),
    route("blog/:slug", "./routes/blog.tsx", { id: "blog-detail" }),
  ]),
  route("sitemap.xml", "./routes/sitemap[.]xml.tsx"),
  route("sitemap-others.xml", "./routes/sitemap-others[.]xml.tsx"),
  route("sitemap-:id.xml", "./routes/sitemap-$id[.]xml.tsx"),
  route("*", "./routes/$.tsx")
] satisfies RouteConfig;
