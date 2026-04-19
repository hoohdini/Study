type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ?? {};
  const error = readParam(params.error);

  const errorMessage =
    error === "auth"
      ? "이메일 또는 비밀번호가 올바르지 않습니다."
      : error === "rate"
        ? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        : error === "env"
          ? "서버 환경변수(.env) 설정이 잘못되었습니다. (AUTH_SECRET 32자 이상, ADMIN_PASSWORD 12자 이상 등)"
          : error === "invalid"
            ? "입력값이 올바르지 않습니다."
            : error === "server"
              ? "서버 오류로 로그인에 실패했습니다. (대부분 DB 연결 문제)"
              : "";

  return (
    <main className="section-light min-h-screen py-16">
      <div className="container max-w-lg rounded-2xl bg-white p-8 shadow-[rgba(0,0,0,0.12)_0px_8px_24px]">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">관리자 로그인</h1>

        {errorMessage && <p className="mb-4 whitespace-pre-line text-sm text-red-600">{errorMessage}</p>}

        <form className="space-y-4" method="post" action="/api/auth/login">
          <div>
            <label htmlFor="email">이메일</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="apple-btn apple-btn-primary" type="submit">
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}
