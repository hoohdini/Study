"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let message = "로그인에 실패했습니다.";
      try {
        const data = (await response.json()) as {
          error?: string;
          code?: string;
          issues?: { path: string; message: string }[];
        };
        if (response.status === 401) {
          message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (response.status === 429) {
          message = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        } else if (response.status === 500 && data.code === "ENV_INVALID") {
          const hint =
            data.issues?.map((issue) => `${issue.path}: ${issue.message}`).join("\n") ?? "";
          message =
            "서버 환경변수(.env) 설정이 잘못되었습니다.\n" +
            "- AUTH_SECRET은 32자 이상\n" +
            "- ADMIN_PASSWORD는 12자 이상\n" +
            "- DATABASE_URL은 현재 실행 방식에 맞는 호스트/포트\n\n" +
            (hint ? `상세:\n${hint}` : "");
        } else if (response.status === 500 && data.code === "LOGIN_FAILED") {
          message =
            "서버 오류로 로그인에 실패했습니다. (대부분 DB 연결 문제) `.env`의 DATABASE_URL이 로컬에서 접근 가능한지 확인해주세요.";
        }
      } catch {
        // ignore JSON parse errors
      }
      setError(message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="section-light min-h-screen py-16">
      <div className="container max-w-lg rounded-2xl bg-white p-8 shadow-[rgba(0,0,0,0.12)_0px_8px_24px]">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">관리자 로그인</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">이메일</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="apple-btn apple-btn-primary" type="submit">
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}
