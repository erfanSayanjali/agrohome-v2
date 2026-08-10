"use client";

import { useParams } from "next/navigation";
import { PageBuilderShell } from "@/components/cms/page-builder-shell";

export default function PageBuilderEditor() {
  const params = useParams<{ id: string }>();
  return <PageBuilderShell pageId={params.id} />;
}
