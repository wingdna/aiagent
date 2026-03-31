import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StructuredSection {
  heading: string;
  content: string;
}

interface ContentMeta {
  structured_sections?: StructuredSection[];
  pros?: string[];
  cons?: string[];
  final_verdict?: string;
}

interface OmniItem {
  summary?: string;
  content?: string;
  content_meta?: ContentMeta;
}

interface OmniRendererProps {
  item: OmniItem;
  size?: 'sm' | 'lg';
}

export const OmniRenderer: React.FC<OmniRendererProps> = ({ item, size = 'sm' }) => {
  const hasStructuredData = item.content_meta?.structured_sections && Array.isArray(item.content_meta.structured_sections) && item.content_meta.structured_sections.length > 0;

  const textSizeClass = size === 'lg' ? 'text-lg' : 'text-sm';
  const fallbackTextSizeClass = size === 'lg' ? 'text-base' : 'text-xs';
  const headingClass = size === 'lg' ? 'text-xl' : 'text-base';

  if (hasStructuredData) {
    return (
      <div className={`space-y-6 text-white ${textSizeClass} leading-relaxed font-sans`}>
        {item.content_meta!.structured_sections!.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className={`text-white font-bold ${headingClass} border-l-4 border-cyan-500 pl-3 uppercase tracking-wide`}>
              {section.heading}
            </h3>
            <p className="whitespace-pre-wrap text-white">{section.content}</p>
          </div>
        ))}

        {item.content_meta!.pros && item.content_meta!.pros.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className={`text-emerald-400 font-bold ${headingClass} border-l-4 border-emerald-500 pl-3 uppercase tracking-wide`}>
              Pros
            </h3>
            <ul className="list-disc list-inside space-y-1 text-emerald-100/80">
              {item.content_meta!.pros.map((pro, idx) => (
                <li key={idx}>{pro}</li>
              ))}
            </ul>
          </div>
        )}

        {item.content_meta!.cons && item.content_meta!.cons.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className={`text-red-400 font-bold ${headingClass} border-l-4 border-red-500 pl-3 uppercase tracking-wide`}>
              Cons
            </h3>
            <ul className="list-disc list-inside space-y-1 text-red-100/80">
              {item.content_meta!.cons.map((con, idx) => (
                <li key={idx}>{con}</li>
              ))}
            </ul>
          </div>
        )}

        {item.content_meta!.final_verdict && (
          <div className="space-y-2 mt-4 bg-cyan-900/20 p-4 rounded-lg border border-cyan-500/30">
            <h3 className={`text-cyan-300 font-bold ${headingClass} uppercase tracking-wide`}>
              Final Verdict
            </h3>
            <p className="whitespace-pre-wrap">{item.content_meta!.final_verdict}</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback to Markdown
  const markdownContent = item.content || item.summary || '';
  return (
    <div className={`text-white ${fallbackTextSizeClass} leading-relaxed prose prose-invert prose-sm max-w-none font-sans prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            h1: ({node, ...props}) => <h1 className={`${size === 'lg' ? 'text-2xl' : 'text-base'} font-bold text-white mb-2`} {...props} />,
            h2: ({node, ...props}) => <h2 className={`${size === 'lg' ? 'text-xl' : 'text-sm'} font-bold text-white mb-2`} {...props} />,
            h3: ({node, ...props}) => <h3 className={`${size === 'lg' ? 'text-lg' : 'text-xs'} font-bold text-white mb-1`} {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};
