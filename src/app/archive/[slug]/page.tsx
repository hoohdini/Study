import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-db";
import { SiteHeader } from "@/components/site-header";
import { toKoreanCategory } from "@/lib/posts";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await safeQuery(
    () =>
      prisma.post.findUnique({
        where: { slug },
        include: { tags: { include: { tag: true } }, attachments: true },
      }),
    null,
  );

  if (!post) notFound();

  return (
    <div className="min-h-screen section-light">
      <SiteHeader />
      <main className="container py-12">
        <p className="mb-3 text-sm text-neutral-500">
          {toKoreanCategory(post.category)} · {new Intl.DateTimeFormat("ko-KR").format(post.publishedAt)}
        </p>
        <h1 className="mb-3 text-4xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mb-8 text-lg text-neutral-700">{post.summary}</p>

        <article className="prose max-w-none rounded-2xl bg-white p-6">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{post.content}</ReactMarkdown>
        </article>

        {post.attachments.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-semibold">첨부 파일</h2>
            <ul className="space-y-2">
              {post.attachments.map((file) => (
                <li key={file.id}>
                  <a className="apple-link" href={`/uploads/${file.storedName}`} target="_blank" rel="noreferrer">
                    {file.original}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
