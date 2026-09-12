#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

script_directory_path="${BASH_SOURCE[0]%/*}"
[[ "${script_directory_path}" != "${BASH_SOURCE[0]}" ]] || script_directory_path="."
readonly SCRIPT_DIR="$(cd -- "${script_directory_path}" && pwd)"
readonly COMPOSE_FILE="${COMPOSE_FILE:-${SCRIPT_DIR}/compose.prod.yaml}"
readonly ENV_FILE="${ENV_FILE:-/etc/portfolio-spring-angular/portfolio.env}"
readonly STATE_DIR="${STATE_DIR:-/var/lib/portfolio-spring-angular-deployment}"
readonly PROJECT_NAME="${COMPOSE_PROJECT_NAME:-portfolio-spring-angular-production}"
readonly LOCAL_ORIGIN="${LOCAL_ORIGIN:-http://127.0.0.1:4000}"
readonly PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://bwetterwald.fr}"
readonly REPRESENTATIVE_PROJECT_PATH="${REPRESENTATIVE_PROJECT_PATH:-/en/projects/portfolio-spring-angular}"
readonly HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-240}"

usage() {
  cat >&2 <<'USAGE'
Usage: deploy.sh <operation> <40-character-lowercase-git-sha>

Operations:
  stage         Pull and start the SHA, then run local checks only.
  verify-local  Recheck the already staged SHA without changing containers.
  finalize      Verify the staged SHA locally and publicly, then record it as deployed.
  deploy        Stage and finalize a SHA; only for automation after the first cutover.
USAGE
}

die() {
  echo "Deployment failed: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command is unavailable: $1"
}

compose() {
  APP_VERSION="${target_sha}" docker compose \
    --project-name "${PROJECT_NAME}" \
    --env-file "${ENV_FILE}" \
    --file "${COMPOSE_FILE}" \
    "$@"
}

wait_for_service() {
  local service="$1"
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  local container_id status

  while (( SECONDS < deadline )); do
    container_id="$(compose ps --quiet "${service}")"
    if [[ -n "${container_id}" ]]; then
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
      case "${status}" in
        healthy)
          echo "${service} is healthy"
          return 0
          ;;
        unhealthy|exited|dead)
          compose logs --tail=100 "${service}" >&2
          die "${service} entered ${status} state"
          ;;
      esac
    fi
    sleep 3
  done

  compose logs --tail=100 "${service}" >&2
  die "${service} did not become healthy within ${HEALTH_TIMEOUT_SECONDS} seconds"
}

assert_service_revision() {
  local service="$1"
  local container_id revision

  container_id="$(compose ps --quiet "${service}")"
  [[ -n "${container_id}" ]] || die "${service} container is not running"
  revision="$(docker inspect --format '{{index .Config.Labels "fr.bwetterwald.deployed-revision"}}' "${container_id}")"
  [[ "${revision}" == "${target_sha}" ]] || die "${service} is running ${revision:-an unknown revision}, expected ${target_sha}"
}

check_http() {
  local url="$1"
  curl --fail --silent --show-error --location --max-time 15 --retry 4 --retry-all-errors --retry-delay 3 --output /dev/null "${url}"
}

check_api_health() {
  local url="$1"
  curl --fail --silent --show-error --max-time 15 --retry 4 --retry-all-errors --retry-delay 3 "${url}" | grep --quiet '"status"[[:space:]]*:[[:space:]]*"UP"'
}

verify_local() {
  assert_service_revision backend
  assert_service_revision frontend
  wait_for_service postgres
  wait_for_service backend
  wait_for_service frontend
  check_http "${LOCAL_ORIGIN}/fr" || die "local French SSR check failed"
  check_http "${LOCAL_ORIGIN}/en" || die "local English SSR check failed"
  check_api_health "${LOCAL_ORIGIN}/api/health" || die "local API health check failed"
  check_http "${LOCAL_ORIGIN}${REPRESENTATIVE_PROJECT_PATH}" || die "local representative project check failed"
  echo "Local verification passed: ${target_sha}"
}

stage() {
  echo "Staging ${target_sha}; the public Nginx route is not changed"
  compose pull frontend backend
  compose up --detach postgres
  wait_for_service postgres
  compose up --detach --no-deps backend
  wait_for_service backend
  compose up --detach --no-deps frontend
  wait_for_service frontend
  verify_local

  printf '%s\n' "${target_sha}" >"${STATE_DIR}/candidate-sha.next"
  mv -- "${STATE_DIR}/candidate-sha.next" "${STATE_DIR}/candidate-sha"
  printf '%s\tstaged\t%s\n' "$(date --utc +%Y-%m-%dT%H:%M:%SZ)" "${target_sha}" >>"${STATE_DIR}/history.tsv"
  echo "Staged successfully. Nginx still requires a separately approved cutover."
}

finalize() {
  local candidate_sha previous_sha

  [[ -r "${STATE_DIR}/candidate-sha" ]] || die "no locally verified candidate SHA is recorded"
  candidate_sha="$(<"${STATE_DIR}/candidate-sha")"
  [[ "${candidate_sha}" == "${target_sha}" ]] || die "candidate SHA ${candidate_sha} does not match ${target_sha}"

  verify_local
  check_http "${PUBLIC_ORIGIN}/fr" || die "public French SSR check failed"
  check_http "${PUBLIC_ORIGIN}/en" || die "public English SSR check failed"
  check_api_health "${PUBLIC_ORIGIN}/api/health" || die "public API health check failed"
  check_http "${PUBLIC_ORIGIN}${REPRESENTATIVE_PROJECT_PATH}" || die "public representative project check failed"

  previous_sha="none"
  [[ ! -r "${STATE_DIR}/current-sha" ]] || previous_sha="$(<"${STATE_DIR}/current-sha")"
  printf '%s\n' "${target_sha}" >"${STATE_DIR}/current-sha.next"
  mv -- "${STATE_DIR}/current-sha.next" "${STATE_DIR}/current-sha"
  printf '%s\tfinalized\t%s\tprevious=%s\n' "$(date --utc +%Y-%m-%dT%H:%M:%SZ)" "${target_sha}" "${previous_sha}" >>"${STATE_DIR}/history.tsv"
  echo "Public deployment verified: ${target_sha}"
}

[[ $# -eq 2 ]] || { usage; exit 64; }
readonly operation="$1"
readonly target_sha="$2"

case "${operation}" in
  stage|verify-local|finalize|deploy) ;;
  *) usage; die "unknown operation: ${operation}" ;;
esac

[[ "${target_sha}" =~ ^[0-9a-f]{40}$ ]] || die "version must be a full 40-character lowercase Git SHA"
[[ "${HEALTH_TIMEOUT_SECONDS}" =~ ^[1-9][0-9]*$ ]] || die "HEALTH_TIMEOUT_SECONDS must be a positive integer"
if [[ "${operation}" == "deploy" && ! -r "${STATE_DIR}/current-sha" ]]; then
  die "deploy is disabled until a deployment has been manually finalized"
fi

require_command curl
require_command docker
require_command flock
require_command grep
require_command install
require_command stat

[[ -r "${COMPOSE_FILE}" ]] || die "Compose file is not readable: ${COMPOSE_FILE}"
[[ -r "${ENV_FILE}" ]] || die "production environment file is not readable: ${ENV_FILE}"

env_mode="$(stat --format='%a' "${ENV_FILE}")"
[[ "${env_mode}" =~ ^[0-7]?[0-7]00$ ]] || die "${ENV_FILE} must not be accessible by group or other users (expected mode 600 or 400)"

install --directory --mode=700 "${STATE_DIR}"
exec 9>"${STATE_DIR}/deploy.lock"
flock --exclusive 9

compose config --quiet

case "${operation}" in
  stage) stage ;;
  verify-local) verify_local ;;
  finalize) finalize ;;
  deploy)
    stage
    finalize
    ;;
esac

echo "Application rollback uses stage/finalize with a prior SHA confirmed compatible with the current Flyway schema."
