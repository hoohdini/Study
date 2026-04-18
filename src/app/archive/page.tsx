import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { SiteHeader } from "@/components/site-header";
import { PostCard } from "@/components/post-card";

export const dynamic = "force-dynamic";

type ArchivePageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const { q, category } = await searchParams;

  const posts = await safeQuery(
    () =>
      prisma.post.findMany({
        where: {
          title: q ? { contains: q, mode: "insensitive" } : undefined,
          category: category === "SOCIETY" || category === "MAJOR" ? category : undefined,
        },
        orderBy: { publishedAt: "desc" },
        include: { tags: { include: { tag: true } } },
      }),
    [],
  );

  return (
    <div className="min-h-screen section-light">
      <SiteHeader />
      <main className="container py-12">
        <h1 className="mb-6 text-4xl font-semibold tracking-tight">아카이브</h1>

        <form className="mb-8 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1fr_180px_auto]">
          <input name="q" defaultValue={q} placeholder="제목으로 검색" />
          <select name="category" defaultValue={category ?? ""}>
            <option value="">전체 카테고리</option>
            <option value="SOCIETY">학회</option>
            <option value="MAJOR">전공</option>
          </select>
          <button className="apple-btn apple-btn-primary" type="submit">
            검색
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              summary={post.summary}
              category={post.category}
              publishedAt={post.publishedAt}
              tags={post.tags.map((item) => item.tag.name)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
