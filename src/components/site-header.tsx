import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="nav-glass sticky top-0 z-50 h-12 text-white">
      <div className="container flex h-full items-center justify-between text-sm">
        <Link href="/" className="font-semibold tracking-tight">
          Study Archive
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/archive">아카이브</Link>
          <Link href="/admin">관리자</Link>
        </nav>
      </div>
    </header>
  );
}
