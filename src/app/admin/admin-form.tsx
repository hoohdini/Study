"use client";

import { useState } from "react";

type UploadInfo = { original: string; storedName: string; mimeType: string; size: number };

async function readErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as {
      error?: string;
      detail?: string;
      issues?: { path: (string | number)[]; message: string }[];
    };
    if (parsed.error && parsed.detail) return `${parsed.error} (${parsed.detail})`;
    if (parsed.error) return parsed.error;
    if (parsed.issues?.length) {
      return parsed.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    }
  } catch {
    /* not JSON */
  }
  if (text.trim()) return text.slice(0, 200);
  return response.statusText || `HTTP ${response.status}`;
}

export default function AdminForm() {
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

    let response: Response;
    try {
      response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          summary,
          content,
          category,
          tags: tags.split(",").map((tag) => tag.trim()),
          attachments: uploads,
        }),
      });
    } catch {
      setMessage("게시물 저장 실패: 네트워크 오류(연결 끊김 또는 차단)입니다.");
      return;
    }

    if (!response.ok) {
      setMessage(`게시물 저장 실패: ${await readErrorMessage(response)}`);
      return;
    }

    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      setMessage(
        `게시물 저장 실패: JSON이 아닌 응답입니다 (${ct || "no content-type"}). API 인증/프록시 설정을 확인해 주세요.`,
      );
      return;
    }

    try {
      await response.json();
    } catch {
      setMessage("게시물 저장 실패: 응답 본문을 파싱할 수 없습니다.");
      return;
    }

    setMessage("게시물이 저장되었습니다. 아카이브(/archive)에서 확인할 수 있습니다.");
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("SOCIETY");
    setTags("");
    setUploads([]);
    // `router.refresh()`는 RSC 갱신 과정에서 이 클라이언트 컴포넌트가 리마운트되며
    // 방금 띄운 성공 메시지까지 초기화되는 경우가 있어 제거합니다.
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

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">관리자 업로드</h1>
        <button onClick={() => void logout()} className="apple-btn apple-btn-outline shrink-0" type="button">
          로그아웃
        </button>
      </div>

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

        {message && <p className="text-sm text-neutral-700">{message}</p>}
        <button className="apple-btn apple-btn-primary" type="submit">
          게시물 저장
        </button>
      </form>
    </>
  );
}
