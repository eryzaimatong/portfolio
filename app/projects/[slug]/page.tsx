import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, bySlug } from "@/data/projects";
import { CaseFile } from "@/components/CaseFile";

export function generateStaticParams() { return projects.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = bySlug((await params).slug);
  return p ? { title: `${p.title} | Eryza Mae Imatong`, description: p.tagline, alternates: { canonical: `/projects/${p.slug}` } } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = bySlug((await params).slug);
  if (!p) notFound();
  return <CaseFile project={p} />;
}
