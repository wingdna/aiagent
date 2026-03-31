/**
 * ==========================================
 * 🛑 [CTO HYDRATION SHIELD] 🛑
 * ==========================================
 * 1. ZERO SPA LOADING SCREENS. No <div id="boot-loader"> in the body.
 * 2. ZERO Client-side environment checks (isMobile, window.innerWidth) during Render.
 * 3. SSR HTML MUST exactly match the first Client-side hydration render.
 * ==========================================
 */
import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  data,
} from "react-router";
import { useEffect } from "react";
import { Telemetry } from "../services/telemetry";
import stylesheet from "../src/index.css?url";
import { Partytown } from "@builder.io/partytown/react";
import { getSupabaseSystemClient } from "../lib/supabase.server";
import { AppProviders } from "./AppProviders";

export const links = () =>[
  { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => {
  return[
    { title: "YouAgent OS | Decentralized AI Discovery" },
    { name: "description", content: "Discover, analyze, and deploy cutting-edge AI agents. The most powerful AI agent management platform." },
  ];
};

export const loader = async ({ request, context }: { request: Request, context: any }) => {
  const headers = new Headers();
  const supabase = getSupabaseSystemClient(request, context.env, headers);
  const { data: { session } } = await supabase.auth.getSession();
  
  return data({ 
    user: session?.user ?? null 
  }, { headers });
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta httpEquiv="x-rocket-loader" content="off" />
        <script
          data-cfasync="false"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (!Object.hasOwn) {
                  Object.hasOwn = function (obj, prop) {
                    return Object.prototype.hasOwnProperty.call(obj, prop);
                  };
                }
              })();
            `,
          }}
        />
        {import.meta.env.PROD && <Partytown debug={true} />}
        {import.meta.env.DEV && (
          <script
            data-cfasync="false"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const downgrade = (s) => {
                    if (s.type === 'text/partytown') {
                      s.type = 'text/javascript';
                      s.async = true;
                    }
                  };
                  document.querySelectorAll('script[type="text/partytown"]').forEach(downgrade);
                  new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                      mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'SCRIPT') downgrade(node);
                      });
                    });
                  }).observe(document.documentElement, { childList: true, subtree: true });
                })();
              `,
            }}
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Orbitron:wght@400;700;900&display=swap" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                overflow: hidden !important;
                height: 100vh !important;
                width: 100vw !important;
                margin: 0;
                background-color: #050505;
                color: #22d3ee;
                font-family: 'Space Mono', monospace;
              }
              #root {
                height: 100vh;
                display: flex;
                flex-direction: column;
              }
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body className="dark bg-[#050505] text-white selection:bg-cyan-500/30 overflow-hidden">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}

// 🛡️ 错误边界维持不变，它是系统崩溃时的最后一道防线
export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops! Something went wrong.";
  let details = "An unexpected error occurred.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    switch (error.status) {
      case 404:
        message = "404: NODE_NOT_FOUND";
        details = "The requested neural path does not exist in the current nexus.";
        break;
      default:
        message = error.statusText || message;
        details = error.data?.message || details;
    }
  } else if (error instanceof Error) {
    details = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('manifest patches')) {
      message = "NEURAL_LINK_INTERRUPTED";
      details = "The connection to the manifest or data stream was severed. This is often temporary.";
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono">
      <title>{message} | YouAgent OS</title>
      <meta name="description" content={details.substring(0, 160)} />
      <h1 className={`text-4xl mb-4 ${message.includes('INTERRUPTED') ? 'text-cyan-500' : 'text-red-500'}`}>{message}</h1>
      <p className="text-gray-500 mb-8 max-w-md text-center">{details}</p>
      {error instanceof Error && !message.includes('INTERRUPTED') && (
        <pre className="bg-red-900/20 p-4 rounded border border-red-500/30 text-xs mb-8 max-w-full overflow-auto">
          {error.stack}
        </pre>
      )}
      <div className="flex gap-4">
        <Link to="/" className="px-6 py-3 border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all">
          RETURN_TO_BASE
        </Link>
        {message.includes('INTERRUPTED') && (
          <button 
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all"
          >
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}