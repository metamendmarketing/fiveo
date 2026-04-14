# Mapping DevTools captures to `discovery_flow`

This is **shape documentation only** — replace URLs and JSON paths with values from **your** Network tab.

`fetch_fitment.rb` walks `discovery_flow` in order. Each step loads one list (e.g. all makes). For **each** item, it runs the remaining steps with extra context variables.

## Variables for `url_template`

Use placeholders in curly braces. They are filled from the **accumulated context**:

- After a step with `"maps_to": "make"` and `"maps_id_to": "make_id"`, later URLs can use `{make}` and `{make_id}`.
- Name the steps so `record_keys` (e.g. `make`, `year`, `model`, `engine`) match `maps_to` values.

Values are URL-encoded automatically.

## One step — fields

| Field | Meaning |
|-------|--------|
| `name` | Debug label (optional) |
| `method` | `GET` or `POST` |
| `url` | Full path or absolute URL for a fixed endpoint |
| `url_template` | Same, but with `{make_id}`-style placeholders |
| `body` | Hash for JSON POST (optional) |
| `form` | Hash for `application/x-www-form-urlencoded` POST (optional) |
| `maps_to` | Context key for the **label** (human text). |
| `maps_id_to` | Context key for the **id** sent to the next request (optional). |
| `extract.items_path` | Where the array lives in JSON — dot path, e.g. `data.items` or empty string if root is already an array |
| `extract.id_key` | Field name inside each item for the id (default `id`) |
| `extract.label_key` | Field for display (default `label`) |

## Fictional example (do not run — URLs are invalid)

```json
"discovery_flow": [
  {
    "name": "makes",
    "method": "GET",
    "url": "/api/example/makes",
    "maps_to": "make",
    "maps_id_to": "make_id",
    "extract": {
      "items_path": "items",
      "id_key": "id",
      "label_key": "name"
    }
  },
  {
    "name": "years",
    "method": "GET",
    "url_template": "/api/example/years?make_id={make_id}",
    "maps_to": "year",
    "maps_id_to": "year_id",
    "extract": {
      "items_path": "years",
      "id_key": "value",
      "label_key": "label"
    }
  }
],
"record_keys": ["make", "year"]
```

Open the **Response** preview in DevTools: if the list is at the root `[...]`, set `"items_path": ""`. If it is `{"results":[...]}`, use `"items_path": "results"`.

## POST bodies

If the finder uses POST, copy the **Payload** from DevTools and reproduce it as `body` or `form`. Replace fixed ids with `{make_id}` in strings if needed (only if the server truly interpolates that way — otherwise use a different template per level).
