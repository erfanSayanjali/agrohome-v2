"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import { MediaPicker } from "@/components/media/media-picker";
import { apiRequest, unwrap } from "@/lib/api";
import { cn } from "@/lib/utils";

type MediaUploadResult = {
  url: string;
  alt?: string | null;
};

export type RichTextEditorProps = {
  value?: string | null;
  onChange?: (html: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
};

const PLUGINS = [
  "advlist",
  "autolink",
  "lists",
  "link",
  "image",
  "charmap",
  "anchor",
  "searchreplace",
  "visualblocks",
  "code",
  "fullscreen",
  "insertdatetime",
  "media",
  "table",
  "preview",
  "help",
  "wordcount",
  "directionality",
].join(" ");

const TOOLBAR = [
  "undo redo | blocks | bold italic underline strikethrough | forecolor backcolor",
  "alignright aligncenter alignleft alignjustify | bullist numlist outdent indent",
  "ltr rtl | link image media table | removeformat code fullscreen | help",
].join(" | ");

const CONTENT_STYLE = `
  body {
    font-family: Vazirmatn, Tahoma, sans-serif;
    font-size: 15px;
    line-height: 1.8;
    color: #f3f6f5;
    background: #122824;
    margin: 1rem 1.1rem;
    direction: rtl;
  }
  a { color: #f4c111; }
  h1, h2, h3, h4, h5, h6 {
    color: #f3f6f5;
    font-weight: 700;
    line-height: 1.4;
  }
  blockquote {
    border-right: 3px solid #f4c111;
    border-left: 0;
    margin: 0;
    padding: 0.35rem 0.9rem;
    color: #a8b8b3;
  }
  table { border-collapse: collapse; width: 100%; }
  table td, table th {
    border: 1px solid rgba(255,255,255,0.12);
    padding: 0.45rem 0.6rem;
  }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  code, pre {
    background: #0c1a17;
    border-radius: 6px;
    padding: 0.15rem 0.35rem;
  }
`;

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  height = 320,
  disabled = false,
  className,
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const filePickerCallbackRef = useRef<((url: string, meta?: Record<string, string>) => void) | null>(
    null
  );

  const uploadImage = useCallback(async (blob: Blob, filename: string) => {
    const fd = new FormData();
    fd.append("file", blob, filename);
    fd.append("alt", filename.replace(/\.[^.]+$/, "") || "image");
    const res = await apiRequest<{ content: MediaUploadResult }>("/admin/media/upload", {
      method: "POST",
      formData: fd,
    });
    return unwrap(res).url;
  }, []);

  const init = useMemo(() => {
    return {
      height,
      menubar: false,
      branding: false,
      promotion: false,
      statusbar: true,
      resize: true as const,
      plugins: PLUGINS,
      toolbar: TOOLBAR,
      toolbar_mode: "wrap" as const,
      skin: "oxide-dark",
      content_css: "dark",
      content_style: CONTENT_STYLE,
      directionality: "rtl" as const,
      placeholder: placeholder || "متن را اینجا بنویسید…",
      relative_urls: false,
      remove_script_host: false,
      convert_urls: true,
      image_title: true,
      automatic_uploads: true,
      file_picker_types: "image",
      images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) =>
        uploadImage(blobInfo.blob(), blobInfo.filename()),
      file_picker_callback: (
        callback: (url: string, meta?: Record<string, string>) => void,
        _value: string,
        meta: { filetype?: string }
      ) => {
        if (meta.filetype !== "image") return;
        filePickerCallbackRef.current = callback;
        setPickerOpen(true);
      },
      setup: (editor: TinyMCEEditor) => {
        editorRef.current = editor;
      },
    };
  }, [height, placeholder, uploadImage]);

  return (
    <div className={cn("admin-tinymce", className)} id={id} data-no-persian-digits>
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        disabled={disabled}
        value={value ?? ""}
        onEditorChange={(html) => onChange?.(html)}
        init={init as never}
      />
      {pickerOpen ? (
        <MediaPicker
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) filePickerCallbackRef.current = null;
          }}
          onSelect={(media) => {
            filePickerCallbackRef.current?.(media.url, {
              alt: media.alt || media.name || "",
            });
            filePickerCallbackRef.current = null;
            setPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
