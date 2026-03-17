import React from "react";

/**
 * Renders a simple subset of markdown into React elements.
 * Handles: **bold**, *italic*, headings, bullet lists, numbered lists,
 * blockquotes (Scripture), section headers, and line breaks.
 */
export function renderMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" = "ul";
    let blockquoteLines: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            if (listType === "ol") {
                elements.push(
                    <ol key={`ol-${elements.length}`} className="space-y-1.5 my-3 ml-5 list-decimal marker:text-primary/50 marker:font-medium text-[13.5px]">
                        {listItems.map((item, i) => (
                            <li key={i} className="pl-1 leading-relaxed">{item}</li>
                        ))}
                    </ol>
                );
            } else {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="space-y-1.5 my-3 ml-4">
                        {listItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                                <span className="text-primary/60 mt-0.5 shrink-0 text-xs">●</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                );
            }
            listItems = [];
        }
    };

    const flushBlockquote = () => {
        if (blockquoteLines.length > 0) {
            elements.push(
                <blockquote
                    key={`bq-${elements.length}`}
                    className="border-l-[3px] border-primary/40 pl-3.5 py-2 my-3 bg-primary/5 dark:bg-primary/10 rounded-r-lg"
                >
                    <div className="relative">
                        <span className="absolute -top-1 -left-1 text-primary/15 text-2xl font-serif leading-none select-none">"</span>
                        {blockquoteLines.map((line, i) => (
                            <React.Fragment key={i}>
                                <span className="italic text-foreground/80 text-[13px] leading-relaxed">{formatInline(line)}</span>
                                {i < blockquoteLines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>
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

        // Horizontal rule
        if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
            flushList();
            flushBlockquote();
            elements.push(<hr key={`hr-${i}`} className="my-4 border-t border-border/40" />);
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

        // Headings
        if (trimmed.startsWith("#### ")) {
            flushList();
            elements.push(
                <h5 key={`h5-${i}`} className="font-semibold text-[13px] mt-4 mb-1.5 text-foreground/85">
                    {formatInline(trimmed.slice(5))}
                </h5>
            );
            continue;
        }
        if (trimmed.startsWith("### ")) {
            flushList();
            elements.push(
                <h4 key={`h4-${i}`} className="font-semibold text-[13.5px] mt-4 mb-1.5 text-primary/90 flex items-center gap-1.5">
                    <span className="w-1 h-4 bg-primary/30 rounded-full shrink-0" />
                    {formatInline(trimmed.slice(4))}
                </h4>
            );
            continue;
        }
        if (trimmed.startsWith("## ")) {
            flushList();
            elements.push(
                <h3 key={`h3-${i}`} className="font-bold text-[14px] mt-5 mb-2 text-foreground flex items-center gap-1.5">
                    <span className="w-1 h-4 bg-primary/40 rounded-full shrink-0" />
                    {formatInline(trimmed.slice(3))}
                </h3>
            );
            continue;
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            if (listType !== "ol" || listItems.length === 0) {
                flushList();
                listType = "ol";
            }
            flushBlockquote();
            listItems.push(formatInline(numberedMatch[2]));
            continue;
        }

        // Bullet list
        const bulletMatch = trimmed.match(/^[*\-]\s+(.+)/);
        if (bulletMatch) {
            if (listType !== "ul" || listItems.length === 0) {
                flushList();
                listType = "ul";
            }
            flushBlockquote();
            listItems.push(formatInline(bulletMatch[1]));
            continue;
        }

        // Section headers like **Header:**
        const sectionMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
        if (sectionMatch) {
            flushList();
            flushBlockquote();
            elements.push(
                <p key={`section-${i}`} className="font-semibold text-[13.5px] mt-4 mb-1 flex items-center gap-1.5">
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
            <p key={`p-${i}`} className="my-1.5 leading-[1.7] text-[13.5px] text-foreground/90">
                {formatInline(trimmed)}
            </p>
        );
    }

    flushList();
    flushBlockquote();

    return <>{elements}</>;
}

/** Format inline markdown: **bold**, *italic*, "scripture" — ref, `code` */
function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    // Match **bold**, *italic*, "quoted scripture" — reference, `code`
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|("(.+?)"(?:\s*—\s*(.+?))?(?=\.|,|\s|$))|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            // **bold**
            parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[2]}</strong>);
        } else if (match[3]) {
            // *italic*
            parts.push(<em key={match.index} className="italic text-foreground/85">{match[4]}</em>);
        } else if (match[5] && match[7]) {
            // "scripture" — reference
            parts.push(
                <span key={match.index} className="italic text-primary/85 font-medium">"{match[6]}"</span>
            );
            parts.push(
                <span key={`ref-${match.index}`} className="text-[11px] text-muted-foreground ml-1 font-medium">— {match[7]}</span>
            );
        } else if (match[8]) {
            // `code`
            parts.push(
                <code key={match.index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary/80">{match[9]}</code>
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
    if (lower.includes("scripture") || lower.includes("snapshot") || lower.includes("verse")) return <span className="text-sm">📖</span>;
    if (lower.includes("reflection") || lower.includes("gentle") || lower.includes("think")) return <span className="text-sm">💭</span>;
    if (lower.includes("voice") || lower.includes("scroll")) return <span className="text-sm">📜</span>;
    if (lower.includes("journal") || lower.includes("spark") || lower.includes("write")) return <span className="text-sm">✍️</span>;
    if (lower.includes("step") || lower.includes("small") || lower.includes("action")) return <span className="text-sm">👣</span>;
    if (lower.includes("prayer") || lower.includes("pray")) return <span className="text-sm">🙏</span>;
    if (lower.includes("keep going") || lower.includes("continue") || lower.includes("remember")) return <span className="text-sm">🌿</span>;
    if (lower.includes("invitation") || lower.includes("insight") || lower.includes("key")) return <span className="text-sm">✨</span>;
    if (lower.includes("takeaway") || lower.includes("summary")) return <span className="text-sm">💡</span>;
    if (lower.includes("question") || lower.includes("ask")) return <span className="text-sm">❓</span>;
    return null;
}
