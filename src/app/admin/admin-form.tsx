"use client";

import { useState } from "react";

type UploadInfo = { original: string; storedName: string; mimeType: string; size: number };

async function readErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as {
      error?: string;
      detail?: string;
      message?: string;
      code?: string;
      issues?: { path: (string | number)[]; message: string }[];
    };
    const bits: string[] = [];
    if (parsed.code) bits.push(`[${parsed.code}]`);
    if (parsed.error && parsed.detail) bits.push(`${parsed.error} (${parsed.detail})`);
    else if (parsed.error) bits.push(parsed.error);
    if (parsed.message) bits.push(parsed.message);
    if (parsed.issues?.length) {
      bits.push(parsed.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    if (bits.length) return bits.join(" ");
  } catch {
    /* not JSON */
  }
  if (text.trim()) return `${response.status} ${text.slice(0, 200)}`;
  return `${response.status} ${response.statusText || "Error"}`;
}

export default function AdminForm() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("SOCIETY");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      setMessage(`파일 업로드 실패: ${await readErrorMessage(response)}`);
      return;
    }

    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      setMessage("파일 업로드 실패: 서버가 JSON이 아닌 응답을 돌려줬습니다. 로그인 상태를 확인해 주세요.");
      return;
    }

    let data: UploadInfo;
    try {
      data = (await response.json()) as UploadInfo;
    } catch {
      setMessage("파일 업로드 응답을 해석하지 못했습니다. 다시 로그인한 뒤 시도해 보세요.");
      return;
    }
    setUploads((prev) => [...prev, data]);
    setMessage(`업로드 완료: ${data.original}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    let navigated = false;

    try {
      let response: Response;
      try {
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            title,
            summary,
            content,
            category,
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            attachments: uploads,
          }),
        });
      } catch (e) {
        console.error("[admin] POST /api/posts network error", e);
        setMessage("게시물 저장 실패: 네트워크 오류(연결 끊김, 차단, 또는 브라우저 확장 프로그램)입니다.");
        return;
      }

      if (!response.ok) {
        const detail = await readErrorMessage(response);
        console.error("[admin] POST /api/posts failed", response.status, detail);
        setMessage(`게시물 저장 실패 (HTTP ${response.status}): ${detail}`);
        return;
      }

      const ct = response.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        console.error("[admin] POST /api/posts unexpected content-type", ct);
        setMessage(
          `게시물 저장 실패: JSON이 아닌 응답입니다 (${ct || "no content-type"}). 로그인·프록시·Nginx 설정을 확인하세요.`,
        );
        return;
      }

      let saved: { slug?: string };
      try {
        saved = (await response.json()) as { slug?: string };
      } catch (e) {
        console.error("[admin] POST /api/posts JSON parse error", e);
        setMessage("게시물 저장 실패: 응답 본문을 파싱할 수 없습니다.");
        return;
      }

      navigated = true;
      const slug = saved.slug;
      if (slug) {
        window.location.assign(`/archive/${encodeURIComponent(slug)}`);
        return;
      }
      window.location.assign("/archive");
    } finally {
      if (!navigated) setSaving(false);
    }
  }

  async function logout() {
    setMessage("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) {
        setMessage(`로그아웃 요청 실패: ${await readErrorMessage(res)}`);
        return;
      }
    } catch {
      setMessage("로그아웃 실패: 네트워크 오류입니다.");
      return;
    }
    window.location.assign("/admin/login");
  }

  const statusTone = /실패|오류|Unauthorized|Invalid|error|failed|HTTP\s[45]/i.test(message)
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">관리자 업로드</h1>
        <button onClick={() => void logout()} className="apple-btn apple-btn-outline shrink-0" type="button">
          로그아웃
        </button>
      </div>

      {(message || saving) && (
        <div
          className={`mb-4 rounded-xl border p-3 text-sm ${message ? statusTone : "border-neutral-200 bg-white text-neutral-600"}`}
          role="status"
        >
          {saving && !message ? "저장 요청 중… (잠시만 기다려 주세요)" : message}
        </div>
      )}

      <form className="space-y-5 rounded-2xl bg-white p-6" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label htmlFor="title">제목</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div>
          <label htmlFor="summary">요약</label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            minLength={10}
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="content">본문 (Markdown)</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={30}
            rows={12}
          />
        </div>
        <p className="text-xs text-neutral-500">
          서버 검증: 제목 3자 이상, 요약 10자 이상, 본문 30자 이상이어야 저장됩니다.
        </p>
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
          <input id="file" type="file" onChange={(e) => void handleFileUpload(e)} />
          {uploads.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-neutral-600">
              {uploads.map((file) => (
                <li key={file.storedName}>- {file.original}</li>
              ))}
            </ul>
          )}
        </div>

        <button className="apple-btn apple-btn-primary" type="submit" disabled={saving}>
          {saving ? "저장 중…" : "게시물 저장"}
        </button>
      </form>
    </>
  );
}
