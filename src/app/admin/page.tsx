"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadInfo = { original: string; storedName: string; mimeType: string; size: number };

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("SOCIETY");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState<UploadInfo[]>([]);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      setMessage("파일 업로드에 실패했습니다.");
      return;
    }

    const data = (await response.json()) as UploadInfo;
    setUploads((prev) => [...prev, data]);
    setMessage(`업로드 완료: ${data.original}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        content,
        category,
        tags: tags.split(",").map((tag) => tag.trim()),
        attachments: uploads,
      }),
    });

    if (!response.ok) {
      setMessage("게시물 저장에 실패했습니다.");
      return;
    }

    setMessage("게시물이 저장되었습니다.");
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("SOCIETY");
    setTags("");
    setUploads([]);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="section-light min-h-screen py-10">
      <div className="container max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">관리자 업로드</h1>
          <button onClick={logout} className="apple-btn apple-btn-outline" type="button">
            로그아웃
          </button>
        </div>

        <form className="space-y-5 rounded-2xl bg-white p-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">제목</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="summary">요약</label>
            <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} required rows={3} />
          </div>
          <div>
            <label htmlFor="content">본문 (Markdown)</label>
            <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={12} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="category">카테고리</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="SOCIETY">학회</option>
                <option value="MAJOR">전공</option>
              </select>
            </div>
            <div>
              <label htmlFor="tags">태그 (쉼표로 구분)</label>
              <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="AI, 운영체제" />
            </div>
          </div>

          <div>
            <label htmlFor="file">첨부 파일 (PDF, 이미지)</label>
            <input id="file" type="file" onChange={handleFileUpload} />
            {uploads.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                {uploads.map((file) => (
                  <li key={file.storedName}>- {file.original}</li>
                ))}
              </ul>
            )}
          </div>

          {message && <p className="text-sm text-neutral-700">{message}</p>}
          <button className="apple-btn apple-btn-primary" type="submit">
            게시물 저장
          </button>
        </form>
      </div>
    </main>
  );
}
