import { Fragment, type ReactNode } from 'react';

/** Minimal, safe light-markdown renderer: "## " headings, "- " bullets,
 *  **bold** and paragraphs. Produces React nodes — never raw HTML. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-navy">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) blocks.push(<ul key={blocks.length} className="my-3 list-disc space-y-1.5 pl-5">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length} className="my-3">{inline(para.join(' '))}</p>);
    para = [];
  };
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) { flushList(); flushPara(); blocks.push(<h3 key={blocks.length} className="mb-2 mt-6 text-lg font-semibold text-navy">{inline(line.slice(3))}</h3>); }
    else if (line.startsWith('- ')) { flushPara(); list.push(line.slice(2)); }
    else if (!line) { flushList(); flushPara(); }
    else { flushList(); para.push(line); }
  }
  flushList();
  flushPara();
  return <div className="text-[15px] leading-relaxed text-navy-700">{blocks}</div>;
}
