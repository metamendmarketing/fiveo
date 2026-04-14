# Motorcycle Fuel Injector Compatibility Plan

> **Status:** Deferred — implement after initial product database and car/truck fitment is live.
>
> **Problem:** Customers ask the client about motorcycle fitment, and he knows he has compatible injectors, but the current product finder only covers cars/trucks. Motorcycle fitment data is not part of the FiveO website.

---

## 1. Where to Get Free Motorcycle Data

### A. Vehicle Hierarchy (Year / Make / Model)

| Source | Type | Cost | Notes |
|--------|------|------|-------|
| [Vehicles-API (GitHub)](https://github.com/GabrielBB/Vehicles-API) | Open-source REST API | Free | Community-maintained, includes motorcycle makes/models |
| [API-Ninjas Motorcycles](https://api-ninjas.com/api/motorcycles) | Commercial API | Free tier (50k req/mo) | Detailed specs: bore, stroke, fuel system type, displacement |
| [Apify Motorcycle Specs](https://apify.com/making-data-meaningful/motorcycle-specs-database) | Scraper/API | Free trial | 40,000+ models with tech fields and images |
| Partzilla / RevZilla OEM Parts | Scraping target | Free (scrape) | Most accurate OEM part number → bike mapping |

### B. Injector Technical Specs & Cross-Reference

| Source | Type | Notes |
|--------|------|-------|
| [Stan Weiss's EFI Flow Data Table](http://www.users.interport.net/s/t/stanweiss/table.html) | Static table | "Holy Grail" of free injector data — flow rates, impedance, part numbers for thousands of injectors |
| [BitTuned Injector Database](https://bittuned.com/) | Searchable DB | ~250+ injectors with specs (flow, impedance, connector) |
| [InjectorRx Database](https://injectorrx.com/) | Searchable DB | Manufacturer-organized, includes resistance, flow rate, visual ID photos |
| [Fuel Injector Connection](https://fuelinjectorconnection.com/) | Tools + data | Injector data search tool, includes powersports/motorcycle/ATV data |

---

## 2. Strategy: Build a Compatibility Engine

Instead of maintaining a manual "injector X fits bike Y" list, build a **spec-based matching engine**.

### Common Motorcycle Injector Physical Profiles

| Profile | Common On | O-Ring Size | Connector |
|---------|-----------|-------------|-----------|
| Pico / Shorty | Harley-Davidson, late Ducatis | 14mm | EV6 (USCAR) |
| Keihin Standard | Honda, Kawasaki, Suzuki | 11mm or 14mm | Denso / Sumitomo |
| Mikuni / Denso | Yamaha, KTM | 11mm | Denso |

### Four Key Matching Attributes

1. **Connector Type** — physical plug shape (EV1, EV6, Denso, Sumitomo, etc.)
2. **Impedance** — high (~12–16Ω) vs. low (~2–4Ω), must match ECU driver
3. **Flow Rate** — cc/min or lb/hr, must be appropriate for engine displacement
4. **O-Ring Diameter** — 11mm vs. 14mm, determines physical fit in fuel rail

### How It Works

1. **Tag every injector product** with the four attributes above (most already exist in our normalized catalog)
2. **Build a motorcycle vehicle table** with stock injector specs per Year/Make/Model
3. **Match automatically** — the AI assistant suggests any injector in inventory that matches the bike's spec profile
4. **Override table** — the client can manually confirm/deny specific matches, building institutional knowledge over time

---

## 3. Implementation Steps (Future)

1. [ ] Ingest motorcycle Year/Make/Model hierarchy from Vehicles-API or API-Ninjas
2. [ ] For each motorcycle model, find the stock injector specs (flow rate, impedance, connector, O-ring size)
   - Source from API-Ninjas detailed specs, OEM parts fiches, or community forums
3. [ ] Add `vehicle_type` column to vehicles table (`car`, `truck`, `motorcycle`, `atv`, etc.)
4. [ ] Build spec-matching query: given a motorcycle's stock injector profile, return all compatible products
5. [ ] Add motorcycle category to the product finder UI
6. [ ] Let the client review and approve/override AI-suggested matches
7. [ ] Consider letting customers submit "I used injector X on bike Y" compatibility reports

---

## 4. Key Considerations

- **Do not assume interchangeability** — even within the same manufacturer (Keihin, Denso), specs vary wildly per application
- **Always verify** connector type, impedance, AND physical dimensions before suggesting a match
- **ECU compatibility** — using wrong impedance injectors can damage the motorcycle's ECU
- **Spray pattern** — car injectors may work physically but have wrong spray angle for motorcycle intake ports
- **Client knowledge** — the client already knows some of his injectors work on motorcycles; capture that knowledge first before relying on external data
