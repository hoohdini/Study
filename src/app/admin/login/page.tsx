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
      setError("로그인에 실패했습니다.");
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
