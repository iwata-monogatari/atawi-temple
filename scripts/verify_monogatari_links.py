#!/usr/bin/env python3
"""related-monogatari.json の公開前検証（公開ゲート）。

related-monogatari.json を更新するたびに実行する。1件でも [NG] が出た場合は push しない。
横展開（ATAWI SPORT 等の姉妹サイト）でも ALLOWED_PREFIX / DATA_PATH / REQUIRED_DISTRICTS を
差し替えるだけで流用できるよう、サイト固有の値は先頭にまとめてある。

使い方:
  python scripts/verify_monogatari_links.py            # フル検証（HTTP検証 + ビルド確認）
  python scripts/verify_monogatari_links.py --skip-http # ネットワーク不通環境向け（オフライン検証のみ）
  python scripts/verify_monogatari_links.py --skip-build # ビルド確認(6,7)を省略
"""

import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "related-monogatari.json"

ALLOWED_PREFIX = "https://iwata-monogatari.net/"
FORBIDDEN_DOMAIN = "pages.dev"
PAGES_JSON_URL = "https://iwata-monogatari.net/data/pages.json"
MAX_ENTRIES_PER_TEMPLE = 5
ALLOWED_RELATIONS = ["direct", "topic", "area"]
REQUIRED_DISTRICTS = {
    "mitsuke", "nakaizumi", "mikuriya", "toyoda", "nanbu",
    "koyo", "ryuyo", "fukude", "toyooka",
}

# 生成後HTMLの抜き取り確認(6)・既存機能確認(7)に使うサンプル寺院（0件側）
SAMPLE_NO_ENTRY_TEMPLE_SLUGS = ["anrakuji-tateno", "shuzoji-toyooka", "kannonji-fukude"]

errors = []
warnings = []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def http_get(url, timeout=15):
    """redirect を追わずに取得する。301/308 はエラーとして呼び出し側に返す。"""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (verify-monogatari-links)"})

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            return None

    opener = urllib.request.build_opener(NoRedirect)
    try:
        resp = opener.open(req, timeout=timeout)
        return resp.getcode(), resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # noqa: BLE001 - ネットワーク例外はまとめて失敗として扱う
        return None, str(e)


def url_to_html_filename(url):
    if not isinstance(url, str) or not url.startswith(ALLOWED_PREFIX):
        return None
    path = url[len(ALLOWED_PREFIX):].split("#")[0].split("?")[0]
    return f"{path}.html" if path else None


def check_schema(data):
    """1. スキーマ検証。致命的な構造異常があれば True を返し、以降の検証を打ち切る。"""
    if not isinstance(data, dict):
        fail("related-monogatari.json はオブジェクトである必要があります")
        return True
    for key in ("version", "updated", "temples", "districts"):
        if key not in data:
            fail(f"トップレベルキー '{key}' がありません")

    temples = data.get("temples", {})
    districts = data.get("districts", {})
    fatal = False

    if not isinstance(temples, dict):
        fail("temples はオブジェクトである必要があります")
        temples = {}
        fatal = True
    if not isinstance(districts, dict):
        fail("districts はオブジェクトである必要があります")
        districts = {}
        fatal = True

    for slug, entries in temples.items():
        if not isinstance(entries, list):
            fail(f"temples.{slug}: 値は配列である必要があります")
            fatal = True
            continue
        if len(entries) > MAX_ENTRIES_PER_TEMPLE:
            fail(f"temples.{slug}: 上限{MAX_ENTRIES_PER_TEMPLE}件を超えています（{len(entries)}件）")
        if len(entries) == 0:
            warn(f"temples.{slug}: エントリが0件です")

        relation_seen = []
        for i, entry in enumerate(entries):
            ctx = f"temples.{slug}[{i}]"
            if not isinstance(entry, dict):
                fail(f"{ctx}: エントリはオブジェクトである必要があります")
                fatal = True
                continue
            for key in ("url", "title", "relation"):
                if key not in entry:
                    fail(f"{ctx}: 必須キー '{key}' がありません")
            relation = entry.get("relation")
            if relation not in ALLOWED_RELATIONS:
                fail(f"{ctx}: relation '{relation}' は {ALLOWED_RELATIONS} のいずれかである必要があります")
            relation_seen.append(relation)

        rank = {"direct": 0, "topic": 1, "area": 2}
        ranks = [rank[r] for r in relation_seen if r in rank]
        if ranks != sorted(ranks):
            warn(f"temples.{slug}: direct → topic → area の優先順で並んでいません")

    missing = REQUIRED_DISTRICTS - set(districts.keys())
    if missing:
        fail(f"districts に不足があります: {sorted(missing)}")
        fatal = True
    extra = set(districts.keys()) - REQUIRED_DISTRICTS
    if extra:
        warn(f"districts に想定外のキーがあります: {sorted(extra)}")

    return fatal


def collect_urls(data):
    """(context, url, title, relation) のリストを作る。"""
    items = []
    for slug, entries in data.get("temples", {}).items():
        if not isinstance(entries, list):
            continue
        for i, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            items.append((f"temples.{slug}[{i}]", entry.get("url"), entry.get("title"), entry.get("relation")))
    for did, url in data.get("districts", {}).items():
        items.append((f"districts.{did}", url, None, None))
    return items


def check_domain(items):
    """2. ドメイン検証（https://iwata-monogatari.net/ 固定・pages.dev 禁止）。"""
    for ctx, url, _title, _relation in items:
        if not isinstance(url, str) or not url.startswith(ALLOWED_PREFIX):
            fail(f"{ctx}: URLが '{ALLOWED_PREFIX}' で始まっていません: {url}")
            continue
        if FORBIDDEN_DOMAIN in url:
            fail(f"{ctx}: 禁止ドメイン '{FORBIDDEN_DOMAIN}' を含むURLです: {url}")


def fetch_pages_index():
    """磐田物語の data/pages.json をライブ取得する（3・4のオフライン照合用）。"""
    code, body = http_get(PAGES_JSON_URL)
    if code != 200:
        fail(f"磐田物語 pages.json の取得に失敗しました (status={code}): {PAGES_JSON_URL}")
        return {}, {}
    try:
        data = json.loads(body)
    except Exception as e:  # noqa: BLE001
        fail(f"pages.json の解析に失敗しました: {e}")
        return {}, {}
    pages_by_file = {p["url"]: p for p in data.get("pages", []) if "url" in p}
    district_files = {d["page"] for d in data.get("districts", []) if "page" in d}
    return pages_by_file, district_files


def check_urls_live(items, pages_by_file, district_files, skip_http):
    """3・4. HTTP 200検証 + タイトル一致検証（+ canonical によるフォールバック誤検知対策）。"""
    for ctx, url, title, _relation in items:
        html_filename = url_to_html_filename(url)
        if html_filename is None:
            continue  # ドメイン不一致は check_domain 側で既にNG済み

        if html_filename in pages_by_file:
            page = pages_by_file[html_filename]
            if page.get("status") != "published":
                fail(f"{ctx}: 磐田物語側の記事が published ではありません (status={page.get('status')}): {url}")
            if title is not None and page.get("title") != title:
                fail(
                    f"{ctx}: タイトルが磐田物語 pages.json と一致しません。"
                    f" 登録='{title}' / pages.json='{page.get('title')}'"
                )
        elif html_filename in district_files:
            pass  # 地区ポータルは pages 配列でなく districts 配列に載る
        elif pages_by_file or district_files:
            fail(f"{ctx}: 磐田物語 pages.json に対応する記事が見つかりません（canonical URL誤り・削除の可能性）: {url}")

        if skip_http:
            continue

        code, body = http_get(url)
        if code != 200:
            fail(f"{ctx}: HTTPステータスが200ではありません (status={code}）。301/308/404は不可: {url}")
            continue

        m = re.search(r'<link rel="canonical" href="([^"]+)"', body)
        canonical = m.group(1) if m else None
        if canonical is None:
            warn(f"{ctx}: 取得したHTMLに canonical タグが見つかりません: {url}")
        elif html_filename and not canonical.endswith(html_filename):
            fail(
                f"{ctx}: 取得ページの canonical が期待値と一致しません"
                f"（別ページへフォールバックしている可能性）。期待末尾='{html_filename}' 実際='{canonical}': {url}"
            )


def run_build():
    """6・7. dist をビルドして既存機能が壊れていないか確認する。

    npm run check は data/temple-media.json 等の無関係な既存データ不整合で失敗しうるため、
    ここでは本改修の対象である astro build 自体の成否のみを見る。
    """
    result = subprocess.run(
        ["npx", "astro", "build"],
        cwd=ROOT,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        shell=True,
    )
    if result.returncode != 0:
        fail("`npx astro build` が失敗しました（既存機能の生成が壊れている可能性）:\n" + result.stdout[-4000:] + result.stderr[-4000:])
        return False
    return True


def check_generated_html(data):
    """6. 生成後HTMLの抜き取り確認。"""
    dist = ROOT / "dist"
    if not dist.exists():
        fail("dist/ が存在しません（ビルドが実行されていません）")
        return

    for slug in data.get("temples", {}).keys():
        html_path = dist / "temples" / slug / "index.html"
        if not html_path.exists():
            fail(f"6. {slug}: dist/temples/{slug}/index.html が生成されていません")
            continue
        html = html_path.read_text(encoding="utf-8")
        if "磐田物語で読む" not in html:
            fail(f"6. {slug}: エントリがあるのに「磐田物語で読む」ブロックが出力されていません")

    for slug in SAMPLE_NO_ENTRY_TEMPLE_SLUGS:
        if slug in data.get("temples", {}):
            continue  # サンプル寺院がエントリを持つように変わった場合はスキップ
        html_path = dist / "temples" / slug / "index.html"
        if not html_path.exists():
            warn(f"6. サンプル確認対象 {slug} の生成ページが見つかりません（slug変更の可能性）")
            continue
        html = html_path.read_text(encoding="utf-8")
        if "磐田物語で読む" in html:
            fail(f"6. {slug}: エントリが無いのに「磐田物語で読む」ブロックが出力されています")

    # real_estate_funnel が off の間は、どのページにも出力されないこと
    any_funnel_leak = False
    for html_path in dist.glob("temples/*/index.html"):
        if "real-estate-note" in html_path.read_text(encoding="utf-8"):
            any_funnel_leak = True
            fail(f"6. {html_path}: real_estate_funnel が off のはずが出力されています")
            break
    if not any_funnel_leak:
        pass  # OK

    # フッターの磐田物語リンクが全ページ共通で出ていること（トップページで代表確認）
    index_html = dist / "index.html"
    if index_html.exists():
        if "iwata-monogatari.net" not in index_html.read_text(encoding="utf-8"):
            fail("6. dist/index.html のフッターに磐田物語リンクが見つかりません")

    # 9地区ページすべてにブロックがあること
    for did in REQUIRED_DISTRICTS:
        area_html = dist / "areas" / did / "index.html"
        if not area_html.exists():
            fail(f"7. dist/areas/{did}/index.html が生成されていません")
            continue
        if "この地区の歴史を磐田物語で読む" not in area_html.read_text(encoding="utf-8"):
            fail(f"6. areas/{did}: 地区ハブへのリンクブロックが出力されていません")


def check_existing_features():
    """7. 既存機能（検索・地区ページ・宗派ページ）の生成が壊れていないこと。"""
    dist = ROOT / "dist"
    for path in ["search/index.html", "sects/index.html", "temples/index.html", "areas/index.html"]:
        if not (dist / path).exists():
            fail(f"7. dist/{path} が生成されていません（既存機能が壊れている可能性）")


def report():
    for w in warnings:
        print(f"[WARN] {w}")
    for e in errors:
        print(f"[NG] {e}")
    if not errors:
        print("[OK] verify_monogatari_links.py: 全項目パスしました")


def main():
    skip_http = "--skip-http" in sys.argv
    skip_build = "--skip-build" in sys.argv

    if not DATA_PATH.exists():
        fail(f"{DATA_PATH} が存在しません")
        report()
        sys.exit(1)

    data = load_json(DATA_PATH)

    fatal = check_schema(data)
    if fatal:
        report()
        sys.exit(1)

    items = collect_urls(data)
    check_domain(items)

    if any(msg.startswith("temples.") or msg.startswith("districts.") for msg in errors):
        # ドメイン違反があるURLはHTTP検証に進めない(pages.dev等を叩かないため)
        report()
        sys.exit(1)

    pages_by_file, district_files = fetch_pages_index()
    check_urls_live(items, pages_by_file, district_files, skip_http)

    if not skip_build:
        if run_build():
            check_generated_html(data)
            check_existing_features()

    report()
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
