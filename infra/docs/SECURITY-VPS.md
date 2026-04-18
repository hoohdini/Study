# VPS 하드닝 (UFW, Fail2ban, 백업 리허설)

## UFW (방화벽)

SSH 세션을 유지한 채로 순서대로 실행합니다.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

SSH 포트를 22가 아닌 값으로 쓰는 경우 `sudo ufw allow <PORT>/tcp`로 맞춥니다.

## Fail2ban

1. 설치: `sudo apt install fail2ban` (Debian/Ubuntu)
2. `infra/fail2ban/filter.d/nginx-study-auth.conf` 를 `/etc/fail2ban/filter.d/` 로 복사합니다.
3. `jail.d`에 실제 `logpath`를 설정합니다. Docker 볼륨이 호스트에 마운트되어 있으면 그 경로를 지정합니다.
4. `sudo systemctl enable --now fail2ban` 후 `sudo fail2ban-client status`.

## 백업 리허설 (1회 권장)

1. 스테이징 또는 복제 DB에서 `infra/scripts/backup-db.sh` 로 덤프 생성.
2. `infra/scripts/restore-db.sh` 로 복구 테스트 (운영 전에는 반드시 백업 먼저).

## Nginx rate limit

`infra/nginx/default.conf` 에 정의되어 있습니다. 트래픽에 맞게 `rate`/`burst` 를 조정하세요.
