import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useLoaderData,
} from "react-router";
import { useEffect } from "react";
import { Telemetry } from "../services/telemetry";
import stylesheet from "../src/index.css?url";
import { Partytown } from "@builder.io/partytown/react";

export const links = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const meta = () => {
  return [
    { title: "YouAgent OS | Decentralized AI Discovery" },
    { name: "description", content: "Discover, analyze, and deploy cutting-edge AI agents. The most powerful AI agent management platform." },
  ];
};

export const loader = async ({ request }: { request: Request }) => {
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile = /Android|iPhone/i.test(userAgent);
  return { isMobile };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { isMobile } = useLoaderData<typeof loader>();
  const location = useLocation();
  useEffect(() => {
    // 🛡️ Protocol V25.0: Neural Resilience Layer
    // Suppress benign React Router manifest fetch errors that can occur in proxied dev environments
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('Failed to fetch manifest patches') || 
          event.message?.includes('Failed to fetch') && event.filename?.includes('react-router')) {
        console.warn('[NEURAL_GUARD] Suppressed benign manifest fetch error:', event.message);
        event.preventDefault();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Failed to fetch manifest patches') || 
          event.reason?.message?.includes('Failed to fetch')) {
        console.warn('[NEURAL_GUARD] Suppressed benign manifest rejection:', event.reason?.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    // 📡 Protocol V14.0: Ignite Telemetry Engine
    Telemetry.init();
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        {import.meta.env.PROD && <Partytown debug={true} />}
        {/* 
          🛡️ Protocol V30.0: Partytown Dev-Mode Resilience
          In development mode, we downgrade Partytown scripts to ordinary async scripts 
          to ensure compatibility with HMR and dev tools.
        */}
        {import.meta.env.DEV && (
          <script
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
        <link rel="preconnect" href="https://kumviyxbodfktoamgazw.supabase.co" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__IS_MOBILE__ = ${isMobile};`,
          }}
        />
      </head>
      <body className="dark bg-[#050505] text-white selection:bg-cyan-500/30">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

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
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all"
          >
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
