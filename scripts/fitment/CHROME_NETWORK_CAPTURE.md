# Capture fiveomotorsport.com vehicle finder traffic (Chrome)

Use this **in your normal browser** where the site already works (you may have passed Cloudflare / bot checks). **Do not guess URLs** — copy them exactly from DevTools after you interact with the finder.

## 1. Open DevTools before you click anything

1. Open Chrome and go to `https://www.fiveomotorsport.com/`.
2. Press **F12** (or **Cmd+Option+I** on Mac) → open the **Network** panel.
3. Check **Preserve log** (so navigation does not clear the list).
4. Click the filter **Fetch/XHR** (or **XHR** in older Chrome). If nothing shows up, use **All** and sort by type later.

## 2. What to click on the page

1. Locate the homepage **product / vehicle finder** (e.g. dropdowns for **Year → Make → Model → Engine**, or similar).
2. **Clear** the network list (circle-with-slash icon) right before you start.
3. Interact in the same order a customer would:
   - Open **Make** (or **Year**, if that loads first).
   - Choose one value, then the next dropdown, and so on until **Engine** (if present).
   - If there is a **Search** or **Show products** step, click it once.

Every time a dropdown populates or results appear, you should see new rows in **Network**.

## 3. Which requests matter

Look for rows that appear **at the moment a dropdown fills in** or **when products list**:

| Clue | Why it matters |
|------|----------------|
| **Type** `xhr` or `fetch` | Usually JSON APIs |
| **MIME** `application/json` in Response | Easy to parse |
| **Initiator** a `.js` file you can open | Shows which code calls the API |
| **Query string** contains `make`, `model`, `year`, `vehicle`, `fitment`, etc. | Likely hierarchy data |

**Ignore static files** (`.js`, `.css`, `.png`, fonts) unless the **Response** is clearly JSON with vehicle lists.

## 4. What to copy for each important request

Click the request → **Headers** (and **Payload** if POST):

1. **Request URL** (full URL, including query string).
2. **Request method** (GET / POST).
3. **Request headers** (see safety section below): at minimum note if **`Cookie`** is present.
4. For POST: **Form Data** or **JSON** body.
5. **Response**: Raw tab — save a **small sample** (first ~50 lines) if it is huge.

Repeat for **each step** of the hierarchy (e.g. request that loads makes, then another that loads years for a make, etc.).

## 5. Export options (easiest → advanced)

- **Copy as cURL**: Right‑click the request → **Copy** → **Copy as cURL**. Paste into a text file; you can trim cookies later.
- **HAR**: Right‑click in the Network list → **Save all as HAR with content**. Good for sharing with tooling (keep cookies private).

## 6. Cookies and auth — use safely

- **Treat `Cookie` like a password.** Anyone with it can act as your logged‑in session.
- **Do not commit** cookie strings, HAR files, or cURL snippets to git.
- Prefer a **local file** listed in `.gitignore`:
  - `scripts/fitment/private/cookies.txt` (Netscape format from “EditThisCookie” / browser extensions), or
  - `scripts/fitment/private/headers.json` with only the headers you need (e.g. `Cookie`, `X-Requested-With`).
- **Rotate / clear** cookies after you are done extracting data.
- If the site uses **CSRF** tokens, copy the same headers the browser sends (often `X-Csrftoken` / form_key pattern on Magento).

## 7. If there is no JSON API

If dropdowns only show **HTML** fragments or the Response is **HTML**:

1. Still copy the **request URL** and parameters — a scraper can request the same URL with your cookie file.
2. Note the **HTML structure** (e.g. `<option value="...">`) in Elements panel.
3. Use the HTML fallback in `fetch_fitment.rb` (see comments there) or a one-off Nokogiri script — **only after** you confirm the response shape.

## 8. What to send back so the script can be finished

Paste (redact long Cookie values if you want — we can use `Cookie: <paste in private file>` locally):

- Full **URL** + **method**
- **Query params** or **POST body** for each step
- **One sample JSON response** per endpoint (or HTML snippet)
- Whether the same **Cookie** header is required for all steps

Then we can wire `site_config.json` mapping without guessing.
