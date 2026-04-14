You pasted live session cookies in chat. Treat them as compromised for security-sensitive accounts.
Rotate: log out of the site or clear site cookies when you are done crawling.

To use crawl_pfcategory_fitment.rb locally:

1. Create folder: scripts/fitment/private/
2. Create file: scripts/fitment/private/cookies.txt
3. Put ONE line — the full value of the "cookie:" request header from Chrome (no word "Cookie:" at the start is OK either way).
4. Never commit private/ (see .gitignore).

If you get Cloudflare_block in JSON output, open the site in a browser, pass the check, then copy a fresh cf_clearance line again.
