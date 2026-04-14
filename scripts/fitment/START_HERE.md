# Start here (beginners)

You are trying to see **which website address** loads when you use the vehicle finder on the homepage.

## 1. Chrome + Network

1. Open **Chrome** and go to **fiveomotorsport.com**.
2. Press **F12** (Mac: **Cmd+Option+I** or **Fn+F12**).
3. Click the **Network** tab.
4. Click **Clear** (circle with slash).
5. Turn **Preserve log** **ON**.

## 2. Use the finder

1. While Network is open, use the homepage finder: open each dropdown and pick values like a customer.
2. Watch for **new lines** appearing in the Network list when a dropdown fills.

Optional filter: click **Fetch/XHR**. If empty, use **All**.

## 3. Copy one request

1. Click **one line** that appeared when a dropdown loaded.
2. Open **Headers**.
3. Copy **Request URL** and note **Request Method** (GET/POST).
4. Open **Response**. Copy the **first part** if it looks like JSON (`{` ... `"` ...).

## 4. Share safely

Paste URL, method, and response **sample** in chat.

**Do not paste** long **Cookie** text.

## 5. After that

Someone can map that to `site_config.local.json` for `fetch_fitment.rb`—you do not have to do that part alone.

## 6. Found endpoint: `/pfcategory/index/options/`

This store’s first dropdown uses **HTML** from that URL (not JSON). Use **`crawl_pfcategory_fitment.rb`** + **`pfcategory_config.local.json`** — see `COOKIES_PRIVATE_README.txt`.

More detail: `CHROME_NETWORK_CAPTURE.md`.
