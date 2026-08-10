"use client";

import { useEffect } from "react";
import { toPersianDigits } from "@/lib/utils";

const SKIP_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "OPTION",
]);

function shouldSkip(node: Node): boolean {
  let el = node instanceof Element ? node : node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.hasAttribute("data-no-persian-digits")) return true;
    if (el.getAttribute("role") === "textbox") return true;
    el = el.parentElement;
  }
  return false;
}

function convertTextNode(node: Text) {
  if (shouldSkip(node)) return;
  const value = node.nodeValue;
  if (!value || !/[0-9]/.test(value)) return;
  const next = toPersianDigits(value);
  if (next !== value) node.nodeValue = next;
}

function walk(root: Node) {
  if (shouldSkip(root)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    convertTextNode(current as Text);
    current = walker.nextNode();
  }
}

/** Converts Latin digits in all visible text to Persian digits (skips form fields). */
export function PersianDigits({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.body;
    walk(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          convertTextNode(mutation.target as Text);
        }
        for (const added of mutation.addedNodes) {
          if (added.nodeType === Node.TEXT_NODE) {
            convertTextNode(added as Text);
          } else if (added.nodeType === Node.ELEMENT_NODE) {
            walk(added);
          }
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
