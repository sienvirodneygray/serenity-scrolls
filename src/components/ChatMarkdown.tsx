import React from "react";

/**
 * Renders a simple subset of markdown into React elements.
 * Handles: **bold**, *italic*, headings, bullet lists, blockquotes, and line breaks.
 */
export function renderMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let blockquoteLines: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="space-y-1 my-2 ml-4">
                    {listItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1 shrink-0">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    const flushBlockquote = () => {
        if (blockquoteLines.length > 0) {
            elements.push(
                <blockquote
                    key={`bq-${elements.length}`}
                    className="border-l-3 border-primary/40 pl-3 py-1 my-2 italic text-foreground/80 bg-primary/5 rounded-r-md"
                >
                    {blockquoteLines.map((line, i) => (
                        <React.Fragment key={i}>
                            {formatInline(line)}
                            {i < blockquoteLines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </blockquote>
            );
            blockquoteLines = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Empty line
        if (trimmed === "") {
            flushList();
            flushBlockquote();
            continue;
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
            flushList();
            blockquoteLines.push(trimmed.slice(2));
            continue;
        } else {
            flushBlockquote();
        }

        // Heading (## or ###)
        if (trimmed.startsWith("### ")) {
            flushList();
            elements.push(
                <h4 key={`h4-${i}`} className="font-semibold text-sm mt-3 mb-1 text-primary/90">
                    {formatInline(trimmed.slice(4))}
                </h4>
            );
            continue;
        }
        if (trimmed.startsWith("## ")) {
            flushList();
            elements.push(
                <h3 key={`h3-${i}`} className="font-bold text-sm mt-3 mb-1">
                    {formatInline(trimmed.slice(3))}
                </h3>
            );
            continue;
        }

        // Bullet list  (* item, - item, or numbered 1. 2. etc.)
        const bulletMatch = trimmed.match(/^[\*\-]\s+(.+)/);
        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
        if (bulletMatch) {
            flushBlockquote();
            listItems.push(formatInline(bulletMatch[1]));
            continue;
        }
        if (numberedMatch) {
            flushBlockquote();
            listItems.push(formatInline(numberedMatch[1]));
            continue;
        }

        // Section headers like **Header:**
        const sectionMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
        if (sectionMatch) {
            flushList();
            flushBlockquote();
            elements.push(
                <p key={`section-${i}`} className="font-semibold text-sm mt-3 mb-0.5 flex items-center gap-1.5">
                    <SectionIcon label={sectionMatch[1]} />
                    {sectionMatch[1]}
                </p>
            );
            continue;
        }

        // Regular text
        flushList();
        flushBlockquote();
        elements.push(
            <p key={`p-${i}`} className="my-1 leading-relaxed">
                {formatInline(trimmed)}
            </p>
        );
    }

    flushList();
    flushBlockquote();

    return <>{elements}</>;
}

/** Format inline markdown: **bold**, *italic*, `code` */
function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    // Match **bold**, *italic*, "quoted scripture", `code`
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|("(.+?)"(?:\s*—\s*(.+?))?(?=\.|,|\s|$))|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            // **bold**
            parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>);
        } else if (match[3]) {
            // *italic*
            parts.push(<em key={match.index}>{match[4]}</em>);
        } else if (match[5] && match[7]) {
            // "scripture" — reference
            parts.push(
                <span key={match.index} className="italic text-primary/80">"{match[6]}"</span>
            );
            parts.push(<span key={`ref-${match.index}`} className="text-xs text-muted-foreground ml-1">— {match[7]}</span>);
        } else if (match[8]) {
            // `code`
            parts.push(
                <code key={match.index} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{match[9]}</code>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Map section labels to small emoji icons */
function SectionIcon({ label }: { label: string }) {
    const lower = label.toLowerCase();
    if (lower.includes("scripture") || lower.includes("snapshot")) return <span className="text-sm">📖</span>;
    if (lower.includes("reflection") || lower.includes("gentle")) return <span className="text-sm">💭</span>;
    if (lower.includes("voice") || lower.includes("scroll")) return <span className="text-sm">📜</span>;
    if (lower.includes("journal") || lower.includes("spark")) return <span className="text-sm">✍️</span>;
    if (lower.includes("step") || lower.includes("small")) return <span className="text-sm">👣</span>;
    if (lower.includes("prayer")) return <span className="text-sm">🙏</span>;
    if (lower.includes("keep going") || lower.includes("continue")) return <span className="text-sm">🌿</span>;
    if (lower.includes("invitation") || lower.includes("insight")) return <span className="text-sm">✨</span>;
    return null;
}
