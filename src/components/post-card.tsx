import Link from "next/link";
import type { Category } from "@prisma/client";
import { toKoreanCategory } from "@/lib/posts";

type PostCardProps = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  publishedAt: Date;
  tags: string[];
};

export function PostCard({ slug, title, summary, category, publishedAt, tags }: PostCardProps) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-[rgba(0,0,0,0.12)_0px_8px_24px]">
      <p className="mb-3 text-xs text-neutral-500">
        {toKoreanCategory(category)} · {new Intl.DateTimeFormat("ko-KR").format(publishedAt)}
      </p>
      <h3 className="mb-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="mb-4 text-sm text-neutral-700">{summary}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs text-neutral-600">
            #{tag}
          </span>
        ))}
      </div>
      <Link href={`/archive/${slug}`} className="apple-link">
        자세히 보기 &gt;
      </Link>
    </article>
  );
}
