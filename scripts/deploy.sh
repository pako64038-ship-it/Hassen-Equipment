#!/usr/bin/env bash
# Build the site and publish it on the gh-pages branch (GitHub Pages).
# Old files under _next/static are kept, so a page a visitor's browser
# still has in cache can load its scripts and styles after a new deploy.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
work="$(mktemp -d)"
git worktree prune
git fetch -q --depth 1 origin +gh-pages:refs/remotes/origin/gh-pages
git worktree add -q -B gh-pages "$work" origin/gh-pages
(
  cd "$work"
  git ls-files | grep -v '^_next/static/' | xargs -r git rm -q --
  cp -r "$OLDPWD/out/." .
  touch .nojekyll
  git add -A
  git -c user.name="pako64038-ship-it" -c user.email="pako64038-ship-it@users.noreply.github.com" \
    commit -q -m "${1:-Deploy site}" || echo "Nothing new to deploy"
  git -c push.negotiate=true push origin gh-pages
)
git worktree remove --force "$work"
