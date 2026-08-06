"use client";

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faBold,
  faEraser,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faQuoteLeft,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";

export default function RichTextEditor({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) {
      editor.current.innerHTML = value;
    }
  }, [value]);

  function run(command: string, argument?: string) {
    editor.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editor.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Enter the link URL");
    if (url) run("createLink", url);
  }

  const toolClass =
    "grid h-8 min-w-8 place-items-center rounded-md px-2 text-xs font-bold text-slate-300 transition hover:bg-white/[.07] hover:text-cyan-300";

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 focus-within:border-cyan-400">
      <div className="flex flex-wrap gap-1 border-b border-slate-800 bg-[#101c24] p-2">
        <button
          type="button"
          title="Heading 2"
          onClick={() => run("formatBlock", "h2")}
          className={toolClass}
        >
          H2
        </button>
        <button
          type="button"
          title="Heading 3"
          onClick={() => run("formatBlock", "h3")}
          className={toolClass}
        >
          H3
        </button>
        <button
          type="button"
          title="Paragraph"
          onClick={() => run("formatBlock", "p")}
          className={toolClass}
        >
          P
        </button>
        <span className="mx-1 w-px bg-slate-700" />
        <button
          type="button"
          title="Bold"
          onClick={() => run("bold")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => run("italic")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          type="button"
          title="Underline"
          onClick={() => run("underline")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button
          type="button"
          title="Bullet list"
          onClick={() => run("insertUnorderedList")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button
          type="button"
          title="Numbered list"
          onClick={() => run("insertOrderedList")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>
        <button
          type="button"
          title="Quote"
          onClick={() => run("formatBlock", "blockquote")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faQuoteLeft} />
        </button>
        <button
          type="button"
          title="Add link"
          onClick={addLink}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faLink} />
        </button>
        <span className="mx-1 w-px bg-slate-700" />
        <button
          type="button"
          title="Undo"
          onClick={() => run("undo")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faArrowRotateLeft} />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => run("redo")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faArrowRotateRight} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          onClick={() => run("removeFormat")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faEraser} />
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-required={required}
        data-placeholder="Write the blog post content…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="rich-text-editor min-h-80 px-5 py-4 text-sm font-normal leading-7 text-slate-200 outline-none"
      />
      <input
        className="sr-only"
        tabIndex={-1}
        required={required}
        value={value.replace(/<[^>]*>/g, "").trim()}
        onChange={() => undefined}
      />
    </div>
  );
}
