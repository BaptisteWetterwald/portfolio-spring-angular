#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

readonly LEGACY_SOURCE="/srv/services/portfolio"
readonly BACKUP_ROOT="/opt/portfolio-backups"
readonly PORTFOLIO_UNIT="/etc/systemd/system/portfolio.service"
readonly NGINX_CONFIG="/etc/nginx/conf.d/bwetterwald.conf"
readonly CLOUDFLARED_UNIT="/etc/systemd/system/cloudflared.service"
readonly CLOUDFLARED_TOKEN="/etc/cloudflared/token"

die() {
  echo "Legacy backup failed: $*" >&2
  exit 1
}

[[ ${EUID} -eq 0 ]] || die "run as root so ownership and host configuration can be preserved"
[[ -d "${LEGACY_SOURCE}/.git" ]] || die "legacy source is not the expected Git repository"
[[ -r "${PORTFOLIO_UNIT}" ]] || die "legacy portfolio systemd unit is unavailable"
[[ -r "${NGINX_CONFIG}" ]] || die "legacy Nginx configuration is unavailable"

readonly timestamp="$(date --utc +%Y%m%dT%H%M%SZ)"
readonly git_sha="$(git -C "${LEGACY_SOURCE}" rev-parse HEAD)"
readonly short_sha="${git_sha:0:12}"
readonly destination="${BACKUP_ROOT}/legacy-${timestamp}-${short_sha}"

install --directory --mode=700 "${BACKUP_ROOT}"
[[ ! -e "${destination}" ]] || die "backup destination already exists: ${destination}"
install --directory --mode=700 "${destination}" "${destination}/host"

# Includes .git, ignored target output, the runnable JAR, and the untracked logs.txt.
cp --archive -- "${LEGACY_SOURCE}" "${destination}/source"
git -C "${LEGACY_SOURCE}" bundle create "${destination}/legacy-repository.bundle" --all
install --mode=600 "${PORTFOLIO_UNIT}" "${destination}/host/portfolio.service"
install --mode=600 "${NGINX_CONFIG}" "${destination}/host/bwetterwald.conf"

{
  echo "created_utc=${timestamp}"
  echo "source=${LEGACY_SOURCE}"
  echo "commit=${git_sha}"
  printf 'branch='; git -C "${LEGACY_SOURCE}" branch --show-current
  echo "ahead_behind_origin_main=$(git -C "${LEGACY_SOURCE}" rev-list --left-right --count HEAD...origin/main | tr '\t' '/')"
  echo "remotes:"
  git -C "${LEGACY_SOURCE}" config --get-regexp '^remote\..*\.url$' | sed -E 's#(https?://)[^/@[:space:]]+@#\1<redacted>@#g'
  echo "worktree_status:"
  git -C "${LEGACY_SOURCE}" status --short --branch
} >"${destination}/git-metadata.txt"

{
  systemctl show portfolio.service -p LoadState -p ActiveState -p SubState -p UnitFileState -p User -p Group -p WorkingDirectory -p MainPID --no-pager
  systemctl show nginx.service -p LoadState -p ActiveState -p SubState -p UnitFileState -p MainPID --no-pager
  systemctl show cloudflared.service -p LoadState -p ActiveState -p SubState -p UnitFileState -p Restart -p MainPID --no-pager
  cloudflared --version 2>&1 || true
  if [[ -e "${CLOUDFLARED_UNIT}" ]]; then
    stat --format='cloudflared_unit=%n mode=%a owner=%U:%G' "${CLOUDFLARED_UNIT}"
  fi
  if [[ -e "${CLOUDFLARED_TOKEN}" ]]; then
    stat --format='cloudflared_token_not_copied=%n mode=%a owner=%U:%G' "${CLOUDFLARED_TOKEN}"
  else
    echo "cloudflared_token_not_copied=${CLOUDFLARED_TOKEN} absent"
  fi
} >"${destination}/host-metadata.txt"

printf '%s\n' "Backup complete; Cloudflare token deliberately excluded." >"${destination}/BACKUP_COMPLETE"
(
  cd "${destination}"
  find . -type f ! -name SHA256SUMS -print0 | sort --zero-terminated | xargs --null sha256sum >SHA256SUMS
  sha256sum --check SHA256SUMS >/dev/null
)

chmod 700 "${destination}"
echo "Legacy backup created: ${destination}"
echo "Cloudflare tunnel secrets were not copied."
