import re, sys
from playwright.sync_api import sync_playwright

import os
URL = os.environ.get("SIDEQUEST_URL", "http://localhost:8123/dist/index.html")
fails, notes = [], []

def check(cond, msg):
    (notes if cond else fails).append(("PASS " if cond else "FAIL ") + msg)

def pick(pg, key, label):
    pg.locator(f'.opt[data-key="{key}"]', has_text=re.compile(f"^{label}$")).click()

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1100, "height": 950})
    errors = []
    IGNORE = ("fonts.googleapis.com", "fonts.gstatic.com")
    pg.on("console", lambda m: errors.append(m.text)
          if m.type == "error" and "status of 403" not in m.text else None)
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.goto(URL); pg.wait_for_load_state("networkidle")

    check(pg.locator('.opt[data-key="gap"]').count() == 4, "4 gap options")
    check(pg.locator('.opt[data-key="setting"]').count() == 3, "indoors / outdoors / either offered")
    check(pg.locator("#places option").count() > 80,
          f"{pg.locator('#places option').count()} places in the autocomplete list")
    check(re.match(r"^\d{2}:\d{2}$", pg.input_value("#clock") or ""),
          f"time field prefilled with now ({pg.input_value('#clock')})")

    # --- free-text location ---
    pg.fill("#where", "mgh"); pg.dispatch_event("#where", "change"); pg.wait_for_timeout(120)
    check("Mary Gates" in pg.locator("#resolved").inner_text(),
          f"'mgh' resolves: {pg.locator('#resolved').inner_text()!r}")

    pg.fill("#where", "odegard"); pg.dispatch_event("#where", "change"); pg.wait_for_timeout(120)
    check("Odegaard" in pg.locator("#resolved").inner_text(), "misspelling 'odegard' resolves")

    pg.fill("#where", "gates"); pg.dispatch_event("#where", "change"); pg.wait_for_timeout(120)
    guesses = pg.locator(".guesses button").count()
    check(guesses >= 2, f"ambiguous 'gates' offers {guesses} suggestions instead of guessing")
    pg.locator(".guesses button").first.click(); pg.wait_for_timeout(120)
    check(pg.input_value("#where") != "gates", "clicking a suggestion fills the field")

    # --- a real run ---
    pg.fill("#where", "the hub"); pg.dispatch_event("#where", "change")
    pg.fill("#clock", "14:10"); pg.dispatch_event("#clock", "change")
    pick(pg, "gap", "90 min"); pick(pg, "budget", r"\$25")
    pick(pg, "mood", "food"); pick(pg, "setting", "either")
    pg.click("#go"); pg.wait_for_selector(".result", timeout=4000)

    title = pg.locator(".result h2").inner_text()
    check(bool(title.strip()), f"quest rendered: {title[:46]!r}")

    widths = pg.eval_on_selector_all(".gap-bar span", "els=>els.map(e=>e.getBoundingClientRect().width)")
    bar = pg.eval_on_selector(".gap-bar", "e=>e.getBoundingClientRect().width")
    check(abs(sum(widths) - bar) < 6, f"gap bar segments fill the width ({sum(widths):.0f}/{bar:.0f}px)")

    clock = pg.locator(".clock").inner_text()
    check("2:10pm" in clock, f"clock line starts at the time entered: {clock.splitlines()[0]!r}")
    times = re.findall(r"(\d{1,2}):(\d{2})(am|pm)", clock)
    mins = [((int(h) % 12) + (12 if ap == "pm" else 0)) * 60 + int(m) for h, m, ap in times]
    check(mins == sorted(mins), f"clock times run forwards: {[t[0]+':'+t[1]+t[2] for t in times]}")
    check(mins[-1] - mins[0] <= 90, "the whole trip fits inside the 90-minute gap")

    facts = pg.locator(".facts").inner_text()
    check("min" in facts and ("indoors" in facts or "outdoors" in facts), "facts row populated")
    check(pg.locator("a.go-maps").get_attribute("href").startswith("https://www.google.com/maps/"),
          "maps link well-formed")
    check(pg.locator(".alt").count() == 3, "3 alternates offered")

    seen = {title}
    for _ in range(5):
        pg.click("#reroll"); pg.wait_for_timeout(170)
        seen.add(pg.locator(".result h2").inner_text())
    check(len(seen) == 6, f"6 rerolls gave {len(seen)} distinct quests")

    # --- hours bite ---
    pg.fill("#clock", "23:30"); pg.dispatch_event("#clock", "change")
    pick(pg, "gap", "120 min"); pick(pg, "mood", "food"); pick(pg, "setting", "indoors")
    pg.click("#go"); pg.wait_for_timeout(300)
    def pool(page):
        if not page.locator(".why li").count(): return 0
        page.locator(".why summary").click(); page.wait_for_timeout(80)
        m = re.search(r"Out of (\d+)", page.locator(".why").inner_text())
        return int(m.group(1)) if m else 0

    late_pool = pool(pg)
    late_title = pg.locator(".result h2").inner_text() if pg.locator(".result h2").count() else ""
    fell_back = pg.locator(".fallback").count() == 1

    pg.fill("#clock", "13:00"); pg.dispatch_event("#clock", "change")
    pg.click("#go"); pg.wait_for_selector(".result")
    day_pool = pool(pg)

    check(late_pool < day_pool,
          f"opening hours shrink the pool: {day_pool} quests at 1pm, {late_pool} at 11:30pm")
    check(fell_back or "Dick" in late_title,
          f"no indoor food open at 11:30pm, and the page says so ({late_title[:36]!r})")
    check(pg.locator(".result h2").count() == 1, "the same filters at 1pm return a quest again")

    # --- outdoors is a hard filter ---
    pick(pg, "setting", "outdoors")
    pg.click("#go"); pg.wait_for_timeout(250)
    if pg.locator(".facts").count():
        check("outdoors" in pg.locator(".facts").inner_text(), "asking for outdoors gives an outdoor quest")
    else:
        check(pg.locator(".empty .again").count() > 0, "no outdoor option, but a way out is offered")

    # --- contrast: the panel is the one place we invert, so check it ---
    def contrast(page, sel):
        return page.eval_on_selector(sel, """el => {
          const lum = c => {
            const [r,g,b] = c.match(/\\d+/g).slice(0,3).map(n => {
              const v = n/255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
            });
            return 0.2126*r + 0.7152*g + 0.0722*b;
          };
          let bg = getComputedStyle(el).backgroundColor, node = el;
          while (bg === 'rgba(0, 0, 0, 0)' && node.parentElement) {
            node = node.parentElement; bg = getComputedStyle(node).backgroundColor;
          }
          const a = lum(getComputedStyle(el).color), b = lum(bg);
          return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
        }""")

    for sel, label in [(".panel h2", "quest title"), (".panel .blurb", "blurb"),
                       (".panel .tip", "tip"), (".panel .clock", "clock line"),
                       ('.opt[aria-pressed="false"]', "unselected option")]:
        if not pg.locator(sel).count(): continue
        c = contrast(pg, sel)
        check(c >= 4.5, f"{label} contrast {c:.2f}:1")

    pg.screenshot(path="/tmp/d2.png", full_page=True)

    # --- installable + works offline ---
    import json as _json
    mani = pg.evaluate("""async () => {
      const link = document.querySelector('link[rel=manifest]');
      if (!link) return null;
      const r = await fetch(link.href);
      return r.ok ? await r.json() : null;
    }""")
    check(mani is not None, "manifest.webmanifest is served")
    if mani:
        check(mani.get("display") == "standalone" and len(mani.get("icons", [])) >= 2,
              f"manifest installable ({mani.get('short_name')}, {len(mani.get('icons', []))} icons)")

    sw = b.new_page()
    sw.goto(URL); sw.wait_for_load_state("networkidle")
    registered = sw.evaluate("""async () => {
      const r = await navigator.serviceWorker.ready.catch(() => null);
      return !!r;
    }""")
    check(registered, "service worker registers")
    if registered:
        sw.wait_for_timeout(600)
        sw.context.set_offline(True)
        sw.reload()
        sw.wait_for_selector("#go", timeout=6000)
        sw.click("#go")
        works = sw.locator(".result h2").count() == 1
        check(works, "the whole app still works with the network cut")
        sw.context.set_offline(False)
    sw.close()

    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    m.goto(URL); m.wait_for_load_state("networkidle")
    m.click("#go"); m.wait_for_selector(".result")
    ov = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check(ov <= 0, f"no horizontal scroll at 390px (overflow {ov}px)")
    m.screenshot(path="/tmp/m2.png", full_page=True)

    d = b.new_page(viewport={"width": 900, "height": 900}, color_scheme="dark")
    d.goto(URL); d.wait_for_load_state("networkidle")
    d.click("#go"); d.wait_for_selector(".result")
    bg = d.eval_on_selector("body", "e=>getComputedStyle(e).backgroundColor")
    check(bg != "rgb(252, 252, 251)", f"dark mode applies (body {bg})")
    for sel, label in [(".panel .blurb", "dark blurb"), (".panel h2", "dark title"),
                       ('.opt[aria-pressed="false"]', "dark unselected option")]:
        if not d.locator(sel).count(): continue
        c = contrast(d, sel)
        check(c >= 4.5, f"{label} contrast {c:.2f}:1")
    d.screenshot(path="/tmp/k2.png", full_page=True)

    check(not errors, "no console errors" + ("" if not errors else f": {errors[:2]}"))
    b.close()

for l in notes: print(l)
for l in fails: print(l)
print(f"\n{len(notes)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
