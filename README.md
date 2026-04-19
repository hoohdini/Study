# Study Archive

학회/전공 학습 내용을 업로드하고 공개 열람하는 관리자 1인 기반 지식 아카이브입니다.

## 기술 스택
- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma
- 관리자 인증: Argon2 해시 + JWT(HttpOnly cookie)
- 파일 업로드: 서버단 MIME/크기 검증 + 랜덤 파일명 저장
- 인프라: Docker Compose + Nginx + HTTPS

## 주요 보안 구성
- `/admin/*`, `/api/posts(POST)`, `/api/upload` 프록시 보호
- 로그인 rate limit 적용
- 보안 헤더(CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- 업로드 화이트리스트 검증(PDF/PNG/JPG/WEBP/GIF)

## 로컬 개발
1. 의존성 설치
   - `npm install`
2. 환경 변수 준비
   - `.env.example` 복사 후 `.env` 작성
   - `npm run dev`로 로컬 접속할 때는 `NODE_ENV=production`을 피하세요.
     - `BASE_URL`이 `https://`인데 `http://localhost`로 접속하면 쿠키 Secure 설정 때문에 로그인 세션이 저장되지 않을 수 있습니다.
     - 필요하면 `.env`에 `COOKIE_SECURE=false`를 추가하세요.
   - `npm run dev`는 호스트에서 실행되므로 `DATABASE_URL`의 호스트가 `postgres`처럼 Docker 내부 DNS면 연결이 실패할 수 있습니다.
     - 로컬 개발이면 `localhost:5432` 같은 호스트로 맞추거나, Docker로 DB만 띄운 뒤 포트를 노출해 접속하세요.
     - 이 repo의 `infra/docker-compose.yml`은 Postgres를 `127.0.0.1:5432`로 호스트에 노출합니다(외부 인터넷에는 안 열림).
3. Prisma 준비
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
   - (기존 DB를 스키마로 먼저 만든 경우) `npx prisma migrate resolve --applied 20260418103000_init`
4. 실행
   - `npm run dev`

## 운영 배포 (VPS + Docker)
1. `.env` 작성
2. 인증서 배치
   - `infra/nginx/certs/fullchain.pem`
   - `infra/nginx/certs/privkey.pem`
3. 빌드 및 실행
   - `cd infra`
   - `docker compose up -d --build`
4. 마이그레이션
   - `docker exec -it study-archive-app npx prisma migrate deploy`

### 마이그레이션 파일
- `prisma/migrations/20260418103000_init/migration.sql`

## 헬스체크
- `GET /api/health`

## 백업/복구
### 백업
- 스크립트: `infra/scripts/backup-db.sh`
- 예시 cron (매일 03:00)
  - `0 3 * * * /path/to/infra/scripts/backup-db.sh`

### 복구
1. DB 컨테이너 접속 가능한 환경에서 SQL 파일 준비
2. 복구 명령
   - `cat backup.sql | docker exec -i study-archive-db psql -U study_user -d study_archive`

## 테스트 체크리스트
- 관리자 로그인 성공/실패 동작
- 비로그인 상태에서 `/admin` 접근 차단
- 글 작성 및 첨부 업로드 성공
- 비허용 타입 업로드 차단
- `/archive`, `/archive/[slug]` 렌더링 확인

## 운영 하드닝 (선택)
- Nginx rate limit 및 access 로그: `infra/nginx/default.conf` (로그는 `nginx_logs` 볼륨)
- VPS 방화벽·Fail2ban: [infra/docs/SECURITY-VPS.md](infra/docs/SECURITY-VPS.md)
- Fail2ban 필터 예시: `infra/fail2ban/filter.d/nginx-study-auth.conf`
- DB 복구 스크립트: `infra/scripts/restore-db.sh`
- CI: `.github/workflows/ci.yml` (lint + Prisma generate + build)

## 최초 배포 후 한 번에 실행할 명령 (요약)

```bash
cd /path/to/Studies
cp .env.example .env   # 값 수정 (비밀번호·AUTH_SECRET·BASE_URL·DB)
# TLS: Let's Encrypt 또는 자체 인증서를 infra/nginx/certs/ 에 배치
cd infra
docker compose up -d --build
docker exec study-archive-app npx prisma migrate deploy
curl -k https://localhost/api/health
```
