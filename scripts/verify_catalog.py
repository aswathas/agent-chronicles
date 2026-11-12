#!/usr/bin/env python3
"""
Verify the catalog against reality.

The catalog is hand-written in generate_catalog.py. That is fine as long as
something checks it, because hand-written catalogs drift: a skill gets
renamed, a repo is deleted, an install command points at a repo that never
had the skill.

This script fails when:
  - an install command points at a skill that does not exist in that repo
  - a repoUrl points at a path that does not exist
  - a skill published in the skills repo is missing from the catalog
  - an entry has a missing or empty field
  - a headline metric is 0 or empty (reads as "this does nothing")
  - an entry does not say whether its number is measured or a design guarantee

Usage:
    python scripts/verify_catalog.py            # check, exit 1 on failure
    python scripts/verify_catalog.py --offline  # skip the network checks
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src" / "data" / "catalog.json"

REQUIRED = [
    "slug", "name", "title", "category", "categorySlug", "badge", "eyebrow",
    "tagline", "installCommand", "cliCommand", "repoUrl", "trigger",
    "modelCard", "problem", "solution", "evaluation", "codeExample",
    "diagramSvg",
]
MODEL_CARD = ["runtime", "type", "transport", "contextTax", "testCoverage",
              "license", "dependencies"]
EVALUATION = ["headlineMetric", "headlineSub", "proofText", "verificationCmd",
              "comparisonTable", "metricKind", "source"]
METRIC_KINDS = {"measured", "count", "design"}

INSTALL_RE = re.compile(r"skills add\s+(?P<owner>[\w.-]+)/(?P<repo>[\w.-]+)@(?P<skill>[\w.-]+)")
REPO_URL_RE = re.compile(r"github\.com/(?P<owner>[\w.-]+)/(?P<repo>[\w.-]+)/tree/(?P<ref>[\w./-]+?)/(?P<path>.+)$")
REPO_ONLY_RE = re.compile(r"github\.com/(?P<owner>[\w.-]+)/(?P<repo>[\w.-]+)")
SCRIPT_RE = re.compile(r"skills/(?P<skill>[\w.-]+)/scripts/(?P<file>[\w.-]+\.(?:py|ps1|sh|js))")

_cache: dict[str, object] = {}


def gh(path: str) -> dict | list | None:
    """gh api, cached. Returns None on any failure."""
    if path in _cache:
        return _cache[path]
    try:
        out = subprocess.run(
            ["gh", "api", path], capture_output=True, text=True, timeout=60
        )
        data = json.loads(out.stdout) if out.returncode == 0 and out.stdout.strip() else None
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        data = None
    _cache[path] = data
    return data


def repo_exists(owner: str, repo: str) -> bool:
    return gh(f"repos/{owner}/{repo}") is not None


def path_exists(owner: str, repo: str, ref: str, path: str) -> bool:
    return gh(f"repos/{owner}/{repo}/contents/{path}?ref={ref}") is not None


def published_slugs(owner: str, repo: str) -> set[str] | None:
    """Skill names listed in the repo's manifest.json, if it has one."""
    raw = gh(f"repos/{owner}/{repo}/contents/manifest.json")
    if not isinstance(raw, dict) or "content" not in raw:
        return None
    import base64
    try:
        manifest = json.loads(base64.b64decode(raw["content"]).decode("utf8", "replace"))
    except (ValueError, json.JSONDecodeError):
        return None
    skills = manifest.get("skills", manifest)
    names = set()
    if isinstance(skills, list):
        for s in skills:
            if isinstance(s, dict):
                name = s.get("name") or s.get("slug")
                if name:
                    names.add(name)
            elif isinstance(s, str):
                names.add(s)
    elif isinstance(skills, dict):
        names.update(skills.keys())
    return names


def skill_dir(owner: str, repo: str, skill: str) -> str | None:
    """The folder a published skill lives in, from the repo manifest."""
    raw = gh(f"repos/{owner}/{repo}/contents/manifest.json")
    if not isinstance(raw, dict) or "content" not in raw:
        return None
    import base64
    try:
        manifest = json.loads(base64.b64decode(raw["content"]).decode("utf8", "replace"))
    except (ValueError, json.JSONDecodeError):
        return None
    skills = manifest.get("skills", manifest)
    entries = skills if isinstance(skills, list) else []
    for entry in entries:
        if isinstance(entry, dict) and entry.get("name") == skill:
            path = str(entry.get("path") or "")
            return path.rsplit("/", 1)[0] if "/" in path else None
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true",
                    help="skip the checks that need the network")
    args = ap.parse_args()

    if not CATALOG.exists():
        print(f"FAIL  {CATALOG} does not exist - run: python src/data/generate_catalog.py")
        return 1
    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    problems: list[str] = []

    print(f"checking {len(catalog)} catalog entries\n")

    for e in catalog:
        slug = e.get("slug", "<no slug>")

        missing = [f for f in REQUIRED if not e.get(f)]
        if missing:
            problems.append(f"{slug}: missing or empty {missing}")

        mc = e.get("modelCard") or {}
        mc_missing = [f for f in MODEL_CARD if f not in mc]
        if mc_missing:
            problems.append(f"{slug}: modelCard missing {mc_missing}")

        ev = e.get("evaluation") or {}
        ev_missing = [f for f in EVALUATION if not ev.get(f) and ev.get(f) != []]
        if ev_missing:
            problems.append(f"{slug}: evaluation missing {ev_missing}")

        metric = str(ev.get("headlineMetric", "")).strip()
        if metric in ("", "0", "0%", "n/a", "N/A", "TBD", "TODO"):
            problems.append(f"{slug}: headlineMetric is {metric!r} - reads as 'does nothing'")
        kind = str(ev.get("metricKind", "")).strip()
        if kind not in METRIC_KINDS:
            problems.append(f"{slug}: evaluation.metricKind must be one of {sorted(METRIC_KINDS)}, got {kind!r}")

        if args.offline:
            continue

        install = str(e.get("installCommand", "")).strip()
        m = INSTALL_RE.search(install)
        if m:
            owner, repo, skill = m.group("owner"), m.group("repo"), m.group("skill")
            if not repo_exists(owner, repo):
                problems.append(f"{slug}: installCommand repo {owner}/{repo} does not exist")
            else:
                published = published_slugs(owner, repo)
                if published is not None and skill not in published:
                    problems.append(
                        f"{slug}: installCommand wants {skill} but {owner}/{repo} manifest does not list it"
                    )
        elif not install:
            problems.append(f"{slug}: installCommand is empty")
        # else: not a skill - a tool or a repo with its own run command. Fine.

        url = str(e.get("repoUrl", "")).strip()
        u = REPO_URL_RE.search(url)
        if u:
            owner, repo, ref, path = u.group("owner"), u.group("repo"), u.group("ref"), u.group("path")
            if not repo_exists(owner, repo):
                problems.append(f"{slug}: repoUrl repo {owner}/{repo} does not exist")
            elif not path_exists(owner, repo, ref, path):
                problems.append(f"{slug}: repoUrl path {path} does not exist in {owner}/{repo}@{ref}")
        else:
            ro = REPO_ONLY_RE.search(url)
            if not ro:
                problems.append(f"{slug}: repoUrl is not a github URL")
            elif not repo_exists(ro.group("owner"), ro.group("repo")):
                problems.append(f"{slug}: repoUrl repo {ro.group('owner')}/{ro.group('repo')} does not exist")

        # a script named in the verification command must exist where it is said to live
        cmd = str(ev.get("verificationCmd", ""))
        for sm in SCRIPT_RE.finditer(cmd):
            skill, filename = sm.group("skill"), sm.group("file")
            owner, repo = "aswathas", "aswath-skills"
            folder = skill_dir(owner, repo, skill)
            if folder is None:
                problems.append(
                    f"{slug}: verificationCmd runs {skill}/scripts/{filename} but {skill} "
                    f"is not published in {owner}/{repo}"
                )
            elif not path_exists(owner, repo, "main", f"{folder}/scripts/{filename}"):
                problems.append(
                    f"{slug}: verificationCmd runs {skill}/scripts/{filename} but that file "
                    f"does not exist in {owner}/{repo}"
                )

    # nothing published should be missing from the site
    if not args.offline:
        for owner, repo in (("aswathas", "aswath-skills"),):
            published = published_slugs(owner, repo)
            if published:
                listed = {e.get("slug") for e in catalog}
                for slug in sorted(published - listed):
                    problems.append(f"{slug}: published in {owner}/{repo} but not in the catalog")

    if problems:
        print(f"FAIL  {len(problems)} problem(s)\n")
        for p in problems:
            print("  -", p)
        return 1

    print("OK  every catalog entry resolves, is complete, and shows a real number")
    return 0


if __name__ == "__main__":
    sys.exit(main())
