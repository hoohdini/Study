import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { SiteHeader } from "@/components/site-header";
import { PostCard } from "@/components/post-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latestPosts = await safeQuery(
    () =>
      prisma.post.findMany({
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: { tags: { include: { tag: true } } },
      }),
    [],
  );

  return (
    <div className="section-light min-h-screen">
      <SiteHeader />

      <section className="section-dark py-24">
        <div className="container text-center">
          <h1 className="mx-auto mb-4 max-w-4xl text-5xl font-semibold leading-[1.08] tracking-[-0.28px] md:text-6xl">
            학회와 전공에서 공부한 내용을
            <br />
            안전하게 기록하는 아카이브
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            정리한 지식을 꾸준히 축적하고, 검색 가능한 포트폴리오 형태로 공개합니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/archive" className="apple-btn apple-btn-primary">
              아카이브 보기
            </Link>
            <Link href="/admin" className="apple-btn apple-btn-outline">
              관리자 업로드
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">최신 학습 노트</h2>
            <Link href="/archive" className="apple-link">
              전체 보기 &gt;
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {latestPosts.map((post) => (
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
        </div>
      </section>
    </div>
  );
}
