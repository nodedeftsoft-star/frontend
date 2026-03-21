"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write here...", className }, ref) => {
    const editor = useEditor({
      extensions: [StarterKit],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    // Update content from outside
    React.useEffect(() => {
      if (editor && editor.getHTML() !== value) {
        editor.commands.setContent(value);
      }
    }, [editor, value]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full min-h-[149px] rounded-md border border-input bg-transparent text-[16px] shadow-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none  focus-within:ring-ring cursor-text overflow-y-auto",
          className
        )}
        onClick={() => editor?.commands.focus()}
      >
        {editor && !editor.getText() && (
          <div className="absolute top-4  text-[#7A7C7E] pointer-events-none">{placeholder}</div>
        )}
        <EditorContent
          editor={editor}
          placeholder="Write here..."
          className="min-h-[149px] prose prose-sm max-w-none focus:outline-none h-full w-full"
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
