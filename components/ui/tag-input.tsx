"use client";

import { useState, useRef } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Type and press Enter or comma",
  disabled = false,
  maxTags = 30,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value || tags.includes(value) || tags.length >= maxTags) return;
    onChange([...tags, value]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 transition-colors focus-within:border-indigo-500",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="tag-chip flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-600/20 px-2 py-0.5 text-xs font-medium text-indigo-300"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 transition-colors hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && tags.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTag(input);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          disabled={disabled}
        />
      )}
    </div>
  );
}
