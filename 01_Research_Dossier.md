# Prerna Aggregation Centres: Research Dossier
**Case:** "Prerna Aggregation Centres – Getting SHG Products to Market at the Right Price" (GDi, Round 1)
**Prepared:** 26 November 2026 · **Stage:** Research foundation. The final PPT, Excel workbook and Prerna 360 app are not built yet.

> **Evidence tags used throughout**
> **[CASE]** stated in the case PDF or dataset · **[CALC]** computed by `analysis/prerna_model.py` from the original dataset · **[EXT-Sxx]** external source, numbered as in `06_Source_Register.md` · **[ASSUMPTION]** analyst assumption, labelled and justified · **[HYPOTHESIS]** needs field validation
>
> All rupee figures are **per month** unless stated otherwise. The dataset is labelled "illustrative figures" [CASE], so treat the outputs as the model's logic, not as audited numbers.

---

## 1. Executive summary

**The problem in one line.** From October 2027 the two ACs must charge buyers the real logistics cost. If they do, **10 of the 20 Prerna products end up priced above the market** [CALC]. That puts **₹93,600 of ₹2,19,300 monthly AC markup (42.7%)** and **₹75,400 of ₹1,80,750 monthly SHG income (41.7%)** at risk. The exposed income belongs to **69 earning women in 10 SHGs (108 members)** [CALC].

**Two root causes explain all 10 failures. AC economics and pricing rules are not among them.**
1. **Legacy AC links (distance).** 7 of the 15 Bijnor-linked SHGs sit in central or east UP and should be linked to Lucknow. Six of them are uncompetitive today. Re-linking moves them to a cheaper tariff band, which saves **₹42,400 a month** in inbound cost with no new infrastructure and no new buyers [CALC].
2. **Courier economics (weight × value density × channel).** All 10 uncompetitive products are sold online, where each unit pays at least ₹50 per order. For low-value staples (jaggery, garam masala, detergent, mustard oil, atta) this courier cost alone is **31–63% of the SHG price**. All five become competitive when sold in bulk at ₹10/kg [CALC]. *All three products already sold in bulk are competitive.*

**Recommended operating model: Option B, a "Right Hub, Right Channel" two-AC model.** It has five parts:
- **Re-link 7 SHGs** (SHG-11 to SHG-17) from Bijnor to Lucknow.
- **Move 5 staple SHGs to bulk** (SHG-01, 05, 06, 09, 16), routed first into the state's **543 Prerna Saras stores** [EXT-S01]. That is about **4 extra units per store per month** [CALC].
- **Keep premium and ODOP/GI products online** and add multi-item **hamper parcels**.
- **Introduce headroom-for-inclusion pricing:** where a product sits far below the market price, the SHG may raise its price, but only together with a commitment to bring non-earning members into production.
- **Make women's income visible and monitored at member level**, through LokOS/DAR and Prerna 360.

**What Option B delivers** [CALC]:
- **20 of 20 products competitive**, no SHG dropped, the women's per-unit income untouched.
- **AC markup at risk falls from ₹93,600 to ₹0.**
- **Logistics outlay falls from ₹4.02 lakh to ₹2.51 lakh a month (−37.5%).**
- Bijnor's *secure* revenue **rises** from ₹75,900 to ₹83,400 even though it hands over seven SHGs. Its headline ₹1,57,500 was never safe, because about half of it came from products that cannot sell at a cost-reflective price.

**Viability needs opex data the case does not give.** Markup is the only income an AC has. Under Option B it covers at most **₹83,400 (Bijnor) and ₹1,35,900 (Lucknow)** of monthly fixed cost. That equals about **6 and 10 minimum-wage staff salaries** respectively, before rent, packaging or utilities [CALC + EXT-S29]. UPSRLM must collect AC-level operating costs before October 2027. We do not claim sustainability without them.

**Social finding.** Only **127 of 213 members (59.6%) earn** from their SHG's Prerna product [CALC]:
- The median earning woman makes **₹1,050 a month**, and the range is **₹400 to ₹7,500**.
- The **top 20% of earners take 48.9%** of all income. The Gini is **0.42 among earners** and **0.66 across all members**.
- Participation and pay move in opposite directions (correlation **−0.74**). Craft SHGs pay well but employ few (34.7% participation, ~₹3,506 a month per earner). Food and other SHGs employ many but pay little (72.3% participation, ~₹913 a month).
- No woman reaches the Lakhpati average of ₹10,000 a month [EXT-S17] from this product alone.

Inclusion therefore has to solve both a **skills** gap (in crafts) and a **demand** gap (in staples). Bringing every SHG to at least 80% participation without cutting anyone's income needs **50 more earning women and about 27.5% more volume (+1,679 units a month)** [CALC].

**Robustness.** The core model survives a 20% fall in volume: all 20 products stay competitive, though AC markup shrinks proportionally. It is **fragile to logistics inflation**: a 10% rise in tariffs makes SHG-11, 14 and 16 uncompetitive again [CALC]. Seven products are left with less than 5% price headroom. Differentiation (GI/ODOP storytelling, hampers) is the buffer that protects them.

---

## 2. Programme and business-model understanding

### 2.1 UPSRLM and the Prerna programme
- **[CASE]** UPSRLM helps women's SHGs in Uttar Pradesh sell under one state brand, **Prerna**, through Aggregation Centres. These are warehouses run by SHG federations that collect, pack and ship products.
- **[EXT-S32]** UPSRLM is the state arm of DAY-NRLM. A state release (2 Sep 2026, reported by Aaj Tak) cites **10.5 lakh+ SHGs and about 1.25 crore rural households** in UP.
- **[EXT-S01, S02]** As of 16 Sep 2026, **3,000+ SHG products** are being connected to **Amazon, Flipkart, Meesho, Prerna Mart, eSARAS and ONDC**, and **543 Prerna Saras stores** operate at district and block level. Online marketing "had already begun through the **Bijnor state aggregation centre**". The article gives no detail on fulfilment, shipping or pricing.
- **[EXT-S33]** In April 2026 the state directed sugarcane co-operative societies to give free space to SHGs for **Prerna Canteens and product display centres**. These are a potential low-cost retail and bulk outlet.
- **[EXT-S34]** A UNI report (26 Oct 2026) says UP district products will reach retail, Amazon/Flipkart and **quick-commerce (Blinkit, Zepto)**. This is a state ODOP/MSME initiative, not necessarily Prerna.

### 2.2 Role of SHGs, federations and producer groups
- **SHGs:** groups of roughly 10–12 women (10–12 members per row in the dataset [CASE]) who save, borrow and increasingly produce.
- **Federations:** Village Organisations, then Cluster Level Federations (CLFs). In this case, federations *run the ACs* [CASE].
- **Producer Groups (PGs)** under DAY-NRLM [EXT-S04]:
  - informal, unregistered business collectives of at least 20 producers of similar products;
  - a 4–6 member management committee that rotates every two years;
  - a Village Level Aggregation Centre for cleaning, grading and packing;
  - members paid **in proportion to sales**;
  - after each cycle, **75% of profit goes to active members by patronage and 25% to a corpus**;
  - working capital borrowed from the CLF; prescribed books (cash book, business register, member ledger and passbook);
  - registration as a producer company or cooperative is recommended after 2–3 years.
- **Relevance to Prerna.** Prerna SHGs sell *single products*, so they already behave like PGs. Two PG rules carry over directly: **patronage-based payout** and the **member ledger**, which is the basis for member-level income tracking. Producer companies (formal entities) become relevant only when ACs need to sign B2B or GeM contracts, open credit lines or register for GST. That is a 2028+ consideration, not a pre-October-2027 one.

### 2.3 Aggregation Centres and the current operating model [CASE]
- Two ACs are live: **Bijnor** (west UP) and **Lucknow** (central UP). Each SHG is linked to one AC and sends *all* its goods there.
- Many SHGs were linked to Bijnor **before Lucknow opened**. This legacy is the source of the distance problem.
- ACs sell through **Online** (one parcel per order, by courier; 1 unit = 1 order) and **Bulk** (B2B buyers and Prerna stores, by shared truck).
- **Pricing rule:** SP = SHG price + inbound + AC markup (15% of SHG price) + outbound. Logistics is *passed through at actual cost*, and the **AC earns only the 15% markup**.
- **Transition:** until now the state paid all logistics. **From October 2027 both ACs pay logistics and recover it in the selling price.**

### 2.4 Value chain and supply chain

```
Women producers ─► SHG (sets SHG price incl. ~12.5% SHG profit)
      │  inbound: weight × ₹10/20/30/40 per kg by distance band to the LINKED AC
      ▼
Aggregation Centre (Bijnor / Lucknow): receive, QC, pack, list, dispatch; earns 15% of SHG price
      │  outbound
      ├─ Online: courier, ₹50 first kg + ₹25 per extra kg or part, per order ─► consumer via Amazon / Flipkart / Meesho / ONDC / eSARAS / Prerna Mart
      └─ Bulk: shared truck, ₹10/kg ─► B2B buyers, Prerna Saras stores
```

**Online vs bulk economics** [CALC]:
- Online outbound is a **fixed ₹50 per unit** for anything up to 1 kg. That is a heavy penalty on cheap items: 50% of jaggery's SHG price, but only 1.25% of a saree's.
- Bulk is **linear in weight**: ₹5 for a 0.5 kg item, ₹50 for a 5 kg bag.
- Distance matters **only for inbound**. Outbound rates do not depend on which AC ships. So AC location changes inbound cost only, never courier or truck cost.
- Under the case tariff, inbound is charged per kg with no volume discount. Consolidating pickups therefore saves nothing *in the model*. In real life a part-load or full-truck contract would, so the rate card should be renegotiated (see §8).

### 2.5 The October-2027 transition: commercial and social challenges
| Challenge | Commercial effect | Social effect |
|---|---|---|
| Logistics moves into the price | 10 of 20 products priced above market [CALC] | Women's income in those SHGs at risk (₹75,400 a month) |
| Legacy Bijnor links | East and central UP SHGs pay ₹30–40/kg instead of ₹10–20 | The SHGs farthest from markets (Gorakhpur, Siddharthnagar, Varanasi) suffer most: 4 of 6 East-UP SHGs are uncompetitive |
| AC pays logistics upfront | Working capital of ~₹8.6–25.7 lakh across both ACs, depending on collection cycle [CALC, ASSUMPTION] | Late SHG payments if ACs run short of cash |
| AC income = markup only | Viability depends on volume, not on logistics savings | AC staffing or closure risk would hit every linked SHG |
| Single-channel habit (17 of 20 online) | High per-unit courier cost; return-to-origin risk not modelled [EXT-S30, S38] | Volume-dependent SHGs with high participation are the most exposed |

---

## 3. Stakeholder map

| Stakeholder | Role / responsibility | Incentive | Potential conflict |
|---|---|---|---|
| **State government / Rural Development Dept.** | Funds UPSRLM; has paid logistics until now | Fiscal relief; visible women's-income results (Lakhpati) | Wants subsidy withdrawn, but cannot accept SHG income collapsing |
| **UPSRLM** (Mission Director, marketing cell) | Prerna brand, AC policy, SHG-AC linkage, marketplace partnerships | Competitive brand; viable ACs; inclusion KPIs | Brand-wide price rules vs product-specific economics |
| **Bijnor AC** (federation-run) | Receives 15 SHGs today; online marketing pioneer [EXT-S01] | Keep volume and markup | **Loses 7 SHGs** under re-linking (₹74,100 a month of markup moves away [CALC]) |
| **Lucknow AC** | Receives 5 SHGs; newer | Gain volume | Capacity: units +98%, kg +155% after re-linking [CALC] |
| **SHG federations (CLF/VO)** | Own and run ACs; lend working capital | AC surplus; member welfare | Surplus retention vs paying SHGs promptly |
| **Individual SHGs** | Produce; set SHG price | Higher volume and price | Re-linking is a change for them; some may resist |
| **Women producers (127 earning)** | Earn SHG profit share | Steady orders, fair pay | Adding members dilutes per-woman income unless demand grows [CALC] |
| **Non-earning members (86)** | Members without Prerna income | Entry into production or AC roles | Earning members may protect their share |
| **Online marketplaces** (Amazon, Flipkart, Meesho, ONDC, eSARAS, Prerna Mart) | Demand, payment, returns | GMV, assortment | Commissions, return-to-origin and payment cycles are *not in the case model* |
| **B2B buyers** | Bulk off-take | Margin on resale | Need resale headroom; the case compares bulk SP with the consumer price |
| **Prerna Saras stores (543)** | State retail network [EXT-S01] | Sell-through | Store margin policy undefined; assortment fit varies by product |
| **Final consumers** | Pay the SP | Value and authenticity | Will buy the cheaper alternative if Prerna is above market |
| **GDi** | Advisor | Credible, implementable design | Must balance competing objectives |

---

## 4. Dataset diagnosis (summary; detail in Registers 2 and 4)

### 4.1 Data dictionary [CASE unless stated]
| Field | Meaning | Unit | Type | Notes / ambiguity |
|---|---|---|---|---|
| SHG ID | Unique SHG | – | Given | 20 unique; no duplicates [CALC] |
| District | SHG location | – | Given | 13 districts |
| Women members | Total SHG members | count | Given | 10–12 |
| Women actively earning from this product | Members who share SHG profit | count | Given | Whether others earn from *other* activities is unknown |
| Distance to Bijnor / Lucknow AC | Road distance | km | Given | 0 km = AC district; 300/500 km values sit on band edges |
| Linked AC (current) | AC receiving all goods | – | Given | Legacy links |
| Product | Single product per SHG | – | Given | Honey appears twice with different benchmarks |
| Weight per unit | Shipping weight | kg | Given | Packaging weight assumed included [ASSUMPTION] |
| SHG price per unit | Price the SHG receives (incl. SHG profit) | ₹ | Given | Cost build-up (materials, labour) not given |
| SHG profit per unit | Distributable surplus | ₹ | Given | 10.7–13.3% of SHG price (≈12.5% typical) [CALC] |
| Units sold per month | Current monthly volume | units | Given | Under state-paid logistics; demand response to new prices unknown |
| Sales channel (current) | Online or Bulk | – | Given | 17 online, 3 bulk |
| Market price of a similar product | Benchmark | ₹ | Given | Source, date, channel (retail vs wholesale) and quality tier unknown |
| Inbound / markup / outbound / SP | Price build | ₹ per unit | **Calculated** | Formulae in §2.3 |
| AC markup per month | 0.15 × SHG price × units | ₹ | **Calculated** | Gross margin; *not* profit |
| SHG income per month | SHG profit × units | ₹ | **Calculated** | Split equally among earners per case rule 7 [ASSUMPTION: equal split] |

### 4.2 Data-quality findings [CALC]
- **No missing values, duplicate IDs or impossible values** (active ≤ members everywhere).
- **Same product, two benchmarks:** honey is ₹350 for SHG-02 (Bijnor) and ₹290 for SHG-11 (Sitapur). This could be regional pricing or a different quality tier. *Ask UPSRLM.*
- **Inconsistent links inside one district:** Sitapur (SHG-10 Lucknow, SHG-11 Bijnor), Siddharthnagar (SHG-17 Bijnor, SHG-18 Lucknow) and Jhansi (SHG-19 Bijnor, SHG-20 Lucknow). This confirms the legacy-linkage story.
- **Distances on band edges:** Varanasi–Lucknow = 300 km and Jhansi–Bijnor = 500 km. We read "101–300" and "301–500" as inclusive of their upper value.
  - ⚠ The Varanasi edge decides SHG-14's fate. If 300 km were billed at ₹30/kg, the wooden toy would cost ₹655 against a ₹650 market and stay **uncompetitive even after re-linking**.
- **The case omits:** AC fixed costs, capacity, packaging, returns or return-to-origin, marketplace commissions and payment terms, GST, SHG cost sheets, member-level earnings, benchmark source and date, and the demand response to price.
- **We did not silently correct anything.** The original file is kept unmodified in `data/`.

### 4.3 Baseline: selling price vs market, current links and channels [CALC]
| SHG | Product | AC · Channel | Inbound | Markup | Outbound | **SP** | Market | Gap | Status |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Jaggery 1 kg | B · Online | 10 | 15 | 50 | **175** | 160 | +15 | ✗ |
| 02 | Honey 500 g | B · Online | 5 | 30 | 50 | **285** | 350 | −65 | ✓ |
| 03 | Brass diya set | B · Online | 10 | 120 | 50 | **980** | 1200 | −220 | ✓ |
| 04 | Papad 500 g | B · Bulk | 5 | 9 | 5 | **79** | 100 | −21 | ✓ |
| 05 | Garam masala 500 g | B · Online | 5 | 12 | 50 | **147** | 120 | +27 | ✗ |
| 06 | Detergent 2 kg | B · Online | 40 | 24 | 75 | **299** | 260 | +39 | ✗ |
| 07 | Zari clutch | B · Online | 10 | 180 | 50 | **1440** | 1600 | −160 | ✓ |
| 08 | Chikankari kurta | L · Online | 5 | 210 | 50 | **1665** | 1900 | −235 | ✓ |
| 09 | Mustard oil 1 L | L · Online | 10 | 24 | 50 | **244** | 220 | +24 | ✗ |
| 10 | Dona-pattal | L · Bulk | 10 | 9 | 10 | **89** | 100 | −11 | ✓ |
| 11 | Honey 500 g | B · Online | 15 | 30 | 50 | **295** | 290 | +5 | ✗ |
| 12 | Masala combo 1 kg | B · Online | 30 | 36 | 50 | **356** | 350 | +6 | ✗ |
| 13 | Banarasi saree | B · Online | 40 | 600 | 50 | **4690** | 5500 | −810 | ✓ |
| 14 | Wooden toy set | B · Online | 40 | 75 | 50 | **665** | 650 | +15 | ✗ |
| 15 | Terracotta horse 2 kg | B · Online | 80 | 150 | 75 | **1305** | 1280 | +25 | ✗ |
| 16 | Multigrain atta 5 kg | B · Online | 200 | 36 | 150 | **626** | 440 | +186 | ✗ |
| 17 | Kala namak rice 1 kg | B · Online | 40 | 21 | 50 | **251** | 240 | +11 | ✗ |
| 18 | Jute bag | L · Bulk | 10 | 18 | 5 | **153** | 180 | −27 | ✓ |
| 19 | Ghee 1 L | B · Online | 30 | 90 | 50 | **770** | 850 | −80 | ✓ |
| 20 | Soft toy | L · Online | 15 | 60 | 50 | **525** | 550 | −25 | ✓ (4.5% headroom) |

**What this means for AC profit.** AC markup does not depend on logistics. It is 15% of the SHG price whatever the freight. So the October-2027 shock reaches AC profit **through volume, not margin**. Case rule 6 says an uncompetitive product "will struggle to sell". On that basis, **42.7% of total markup (₹93,600 of ₹2,19,300) is at risk**:
- **Bijnor: ₹81,600 of ₹1,57,500 at risk (52%).**
- **Lucknow: ₹12,000 of ₹61,800 at risk (19%).** The only exposed product is SHG-09 mustard oil.

---

## 5. Product-level strategic observations

**ODOP/GI linkage (external, verified).** 9 of the 20 products map to an ODOP (UP ODOP or PMFME-ODOP) and/or a GI:
- Bijnor jaggery: PMFME-ODOP [EXT-S07]
- Moradabad brass: ODOP metal craft and GI [EXT-S08, S28]
- Badaun zari-zardozi: ODOP [EXT-S37]
- Lucknow chikankari: ODOP and GI [EXT-S28]
- Varanasi Banarasi saree: ODOP and GI
- Varanasi wooden toys: GI "Varanasi Wooden Lacquerware & Toys" [EXT-S28]
- Gorakhpur terracotta: ODOP and GI
- Siddharthnagar kala namak rice: ODOP, PMFME-ODOP and GI
- Jhansi soft toys: ODOP [EXT-S08]

*Whether each SHG's item actually qualifies (for example, lacquerware vs other wooden toys) must be verified.* This matters because ODOP products are eligible for ODOP Marketing Development Assistance, CFCs and, for PMFME-ODOP foods, branding and common-infrastructure support (§6.3).

### 5.1 Portfolio classification [CALC + judgement]
| Category (brief) | SHGs | Evidence | Strategic move |
|---|---|---|---|
| **Protect & scale** (competitive, ≥10% headroom) | 02 honey (B), 03 brass, 04 papad, 07 zari, 08 chikankari, 13 saree, 18 jute bag, 19 ghee (9.4%, near) | Headroom 9–21% | Keep channel; grow volume; consider headroom-for-inclusion pricing on D2C items (02, 03, 08, 13) |
| **Logistics optimisation (re-link)** | 11, 12, 13, 14, 15, 16, 17 | ₹10–100 per unit inbound saving | Re-link to Lucknow; 13 is already competitive but saves ₹20 per unit |
| **Channel shift to bulk** | 01 jaggery, 05 garam masala, 06 detergent, 09 mustard oil, 16 atta | Online outbound = 31–63% of SHG price | Prerna Saras stores, institutional buyers, GeM SARAS; keep a small online presence through hampers |
| **Premium positioning needed** (thin headroom after fixes) | 14 wooden toy (0.8%), 15 terracotta (1.2%), 17 kala namak (3.8%), 20 soft toy (4.5%), 11 honey (1.7%), 12 masala (4.0%) | <5% headroom; a 10% freight rise flips 11 and 14 | GI/ODOP storytelling, gift packaging, hampers, ODOP MDA support; revalidate benchmarks |
| **Turnaround** | 16 atta | Needs *both* re-link and bulk; 3.2% bulk headroom; 5 kg @ ₹48/kg | Bulk-only; institutional and store channel; review pack size and recipe |
| **Demand validation required** | All bulk moves (+2,250 units a month) and hampers | Bulk demand not in the case | Pre-orders and store commitments before switching channel |

### 5.2 Product notes (selected)
- **Jaggery (SHG-01).** The cheapest AC is already its own (0 km). Online fails because courier is 50% of the price. **Even at 0% markup it only matches the market price** (₹160 = ₹160; max online markup = 0.0%) [CALC]. Bulk SP is ₹135 vs ₹160. It is a PMFME-ODOP of Bijnor, so it can draw PMFME branding support [EXT-S07]. Lowest-cost bulk route: Prerna stores and canteens.
- **Garam masala (SHG-05) and mustard oil (SHG-09).** Online, garam masala stays above market even at zero markup (₹135 vs ₹120). Mustard oil only matches the market at zero markup (₹220 = ₹220) [CALC]. Bulk works (₹102 vs ₹120; ₹204 vs ₹220), though mustard oil's bulk headroom (7.3%) is thin for a third-party retailer.
- **Detergent (SHG-06).** Hapur is 110 km away, just past the ₹10 band, so every 2 kg bag pays ₹40 inbound. Bulk headroom is 6.2%. It is an FMCG commodity against national brands, so it suits institutional buyers (hostels, offices) better than retail [HYPOTHESIS].
- **Multigrain atta (SHG-16).** The worst case: ₹626 vs ₹440 (+42%). Inbound 200 + courier 150 = 56% of SP. Re-link plus bulk gives ₹426, but only 3.2% headroom. **Do not sell it online at all.** Explore Gorakhpur-area institutional buyers and Prerna canteens [HYPOTHESIS].
- **Kala namak rice (SHG-17).** GI and ODOP, 700 units a month, 10 earners. Re-linking saves ₹14,000 a month, the second-largest saving. Its 3.8% headroom is thin, *but the ₹240 benchmark may not reflect GI-certified kala namak*. Validate before deciding the price [HYPOTHESIS].
- **Wooden toy (SHG-14) and terracotta (SHG-15).** Both GI crafts, both just over the market today, both just under it after re-linking. They are the clearest case for **premium storytelling and gift packaging**. The extra price has to come from differentiation, not cost cutting.
- **Saree (SHG-13), chikankari (SHG-08), brass (SHG-03).** Very large headroom (₹220–₹810 per unit) but **2–5 earners out of 10–12**. Here the issue is inclusion, not price.
- **Ghee (SHG-19) and soft toy (SHG-20).** Jhansi is in the ₹30 band from *both* ACs (500 and 320 km). Lucknow is closer, but **closeness saves nothing**. Leave SHG-19 at Bijnor to avoid transition cost and to protect Bijnor's volume.

### 5.3 Should weight, perishability and fragility drive channel choice? Yes.
| Attribute | Favours online (D2C) | Favours bulk | Prerna examples |
|---|---|---|---|
| Value density (₹ per kg) | High (≥ ~₹400/kg) | Low (< ~₹200/kg) | Saree ₹4,000/kg vs atta ₹48/kg |
| Unit weight | ≤ 1 kg (₹50 flat) | Heavy (online adds ₹25 per extra kg) | Atta 5 kg, detergent 2 kg |
| Perishability / shelf life | Long | Short shelf life needs fast-moving stores | Ghee, oils, flour need FIFO and date coding [HYPOTHESIS] |
| Fragility | Robust items | Fragile items ship more safely by truck (fewer handling points) | Terracotta, brass diya; online breakage risk not in case |
| Order frequency | Occasional or gift purchases | Repeat staples | Staples suit stores and subscriptions |
| Story / authenticity | GI and ODOP premium | Commodity | GI crafts online; staples in bulk |

---

## 6. Government ecosystem research

### 6.1 DAY-NRLM and the SHG ecosystem
- **Structure.** SHG, then VO, then CLF. PGs sit below the CLF and are business-focused, with patronage payouts and a corpus [EXT-S04]. Nationally, about **94,000 PGs** have been promoted [EXT-S04].
- **Market-linkage stack (national).**
  - **eSARAS**: the official MoRD marketplace, with a fulfilment centre and app. It is a seller network participant on ONDC, with 800+ handcrafted products across 11+ buyer apps, and it launched the **SARAS Shakti** premium gift line for institutional and corporate buyers in 2026 [EXT-S03].
  - **GeM SARAS Collection**: a storefront for government buyers in 5 categories (handicrafts; handloom and textiles; office accessories; grocery and pantry; personal care and hygiene), with 3,784 SHGs registered [EXT-S25].
  - **MoUs** with Flipkart (Samarth), Amazon (Saheli), Meesho and JioMart [EXT-S24].
  - MoRD is also redesigning eSARAS into a **multi-vendor, omni-channel marketplace** and planning **SHE-Marts** [EXT-S35].
- **Income measurement.**
  - A **Lakhpati Didi** is an SHG member whose **household** earns at least ₹1 lakh a year, averaging ₹10,000 a month, sustained over at least four seasons or business cycles [EXT-S17].
  - Tracking runs through **LokOS** and **Digital Aajeevika Registers (18.5 crore DARs)** [EXT-S27].
  - **Implication:** the Lakhpati metric is household-level, so it cannot show *intra-SHG* inequality. Prerna needs its own member-level product-income KPI.
- **Impact evidence.** 3ie's 15-year DAY-NRLM evaluation reports NRLM led to a **~10% income increase** [EXT-S19]. The earlier NRLP evaluation found higher income and savings through better finance and more income sources [EXT-S20]. Both are independent evaluations with MoRD, the Gates Foundation and the World Bank.

### 6.2 The existing Prerna ecosystem: leverage before building
| Asset | Fact | How Prerna uses it |
|---|---|---|
| 543 Prerna Saras stores [EXT-S01] | District and block level | **Primary bulk outlet** for staples; monthly milk-run replenishment by shared truck |
| Bijnor AC online operation [EXT-S01] | Already running marketplace sales | Make Bijnor the online-fulfilment centre of excellence; keep west-UP SHGs |
| Prerna Mart, eSARAS, ONDC, Amazon, Flipkart, Meesho [EXT-S01] | Listings exist | List premium and GI items and hampers; compare commissions channel by channel (not in case) |
| GeM SARAS Collection [EXT-S25] | Government buyers | Institutional bulk for staples (grocery and pantry) and corporate gifting (handicrafts) |
| Prerna Canteens in sugar societies [EXT-S33] | Free space for SHGs | Captive bulk buyer for jaggery, oil, atta, masala [HYPOTHESIS] |
| eSARAS SARAS Shakti gift line [EXT-S03] | Institutional and corporate gifting | Channel for Prerna GI hampers |
| LokOS / DAR [EXT-S27] | Member records | Data backbone for member-level income tracking |

### 6.3 Scheme convergence: what each scheme can and cannot fund
| Scheme | Objective & beneficiaries | Support (verified) | Relevant to Prerna | Realistic fit |
|---|---|---|---|---|
| **DAY-NRLM** (MoRD) | Poverty reduction through SHG institutions | Community investment funds; PG infrastructure and working capital under 2020 financing guidelines; working capital from CLF [EXT-S04] | AC working capital, PG formation, cadre support | **High**: the parent programme |
| **PMFME** (MoFPI) | Formalise micro food processing | **Seed capital ₹40,000 per SHG member** for working capital and small tools, **max ₹4 lakh per SHG federation** [EXT-S05]; credit-linked grant of 35% for groups; common infrastructure and branding & marketing; *common infrastructure and branding support only for ODOP products* [EXT-S06, S36-NULM note] | Food SHGs (01, 02, 04, 05, 09, 11, 12, 16, 17, 19): working capital and tools; **jaggery (Bijnor) and kala namak rice (Siddharthnagar/Gorakhpur) are PMFME-ODOPs** [EXT-S07] | **High** for seed capital; **medium** for branding (eligibility thresholds per guidelines must be checked) |
| **UP ODOP** (UP MSME / ODOP Cell) | Promote district products | Schemes: **CFC** (state grant up to **90%** of project cost) [EXT-S09, S10]; **Marketing Development Assistance** (fairs, exhibitions, branding, packaging, buyer-seller meets) [EXT-S08, S09]; **Margin Money**; **Skill Development & Toolkit** [EXT-S08] | Crafts SHGs 03, 07, 08, 13, 15, 20 (and 14, 17 if eligible): exhibitions, packaging, toolkits for **training non-earning members** | **High** for MDA and toolkit; CFC only if a cluster SPV exists |
| **SFURTI** (Ministry of MSME) | Cluster development of traditional industries | **Grant up to ₹2.5 cr (regular, ≤500 artisans) / ₹5 cr (major, >500)** through an implementing agency and SPV [EXT-S12] | Varanasi or Gorakhpur craft clusters, *if* a cluster of ≥ ~50 artisans and an implementing agency exist | **Low–medium**: long cycle; the 20 SHGs alone are too small |
| **PM MUDRA** (DFS) | Collateral-free micro-enterprise loans | Shishu ≤ ₹50k; Kishore ≤ ₹5 lakh; Tarun ≤ ₹10 lakh; Tarun Plus ≤ ₹20 lakh (repeat borrowers) [EXT-S13] | Individual women entrepreneurs scaling up (e.g., a saree weaver's loom) | **Medium**: individual credit, not AC operations |
| **NABARD** | Rural finance and producer organisations | Grant support for SHGs/POs to train and onboard to **digital marketplaces and ONDC**; physical marketing (gram dukans, carts, stalls); rural haats and marts; OFPO promotion [EXT-S15, S16] | ONDC onboarding and cataloguing; stalls; OFPO for crafts later | **Medium** |

> **Caveat (source conflict).**
> - *ODOP CFC:* a 2020 interview cites a cap of ₹13.5 crore [EXT-S10], while a 2026 report describes 90% support for projects up to ₹15 crore [EXT-S10b]. Confirm with the ODOP Cell.
> - *SFURTI:* UP's MSME portal lists both the current ₹2.5/5 crore limits and an older three-tier structure (₹1.5/3/8 crore) [EXT-S11]. Lok Sabha AU1132 confirms ₹2.5/5 crore [EXT-S12].
> - *General rule:* none of these schemes is shown to fund **ongoing logistics subsidies**, and we do not claim they do.

---

## 7. Industry benchmarking: what Prerna can learn
| Model | How it works | Transferable lesson | Not comparable because |
|---|---|---|---|
| **Kudumbashree (Kerala)** | Marketing through fairs, permanent stores, e-commerce, *government convergence*, and the **Home Shop** network, where a district unit collects products and community sales women sell door to door [EXT-S21] | **Separate production from marketing**; use government procurement; build a community-based last-mile channel for staples | Kerala's state-wide institutional depth; densely urbanised consumer base |
| **Amul (Anand pattern)** | Three tiers (village society, district union, state federation); the federation owns brand and marketing; it reports returning **80–85% of the consumer rupee** to farmers (*self-reported*) [EXT-S22] | One state brand, decentralised aggregation, **professional marketing at the apex**, and transparent producer payout | A single high-frequency commodity (milk) with daily cash flow |
| **Lijjat Papad** | Women-owned; branches run in a decentralised way; papads hand-rolled at members' homes to keep overheads low; profit or loss shared among sister-members [EXT-S23] | **Home-based, standardised work spreads earnings across many women**; strict quality standard | One SKU, built over decades; cost-plus pricing |
| **eSARAS / SARAS** (national) | Central fulfilment centre, ONDC seller participant, physical gallery, melas [EXT-S03] | Prerna can **plug in rather than rebuild** for national reach and premium gifting | A national curation model, not a state logistics model |
| **Saras / state SRLM brands** (e.g., Uttarakhand's HILANS) | State brand plus district packaging units [EXT-S39] | District-level packaging improves shelf readiness | Different product mix |

---

## 8. Logistics research and an AC allocation framework

### 8.1 Distribution models and their fit
| Model | How it works | Where useful | Cost implication | Fit for Prerna |
|---|---|---|---|---|
| **Hub-and-spoke** (current) | SHGs send to a hub (AC), which dispatches | Many small suppliers, many SKUs | Two legs (inbound + outbound) | **Keep**, but assign spokes to the cheapest hub |
| **Regional warehousing / multi-warehouse inventory** | Stock positioned nearer demand | High-volume D2C | Holding cost and duplicated inventory | Not justified at ~6,100 units a month |
| **Cross-docking** | Goods transfer from inbound to outbound with minimal storage | Bulk orders with known destinations | Lower holding cost | **Yes, for bulk staples**: receive, consolidate per store route, dispatch |
| **Consolidated shipping / hampers** | Several items in one parcel | Courier tariffs with a fixed first-kg charge | Cuts per-unit outbound (e.g., ₹50 to ₹25 for two 0.5 kg items) [CALC] | **Yes**: S4 saves ₹15,000 a month |
| **Milk-run collection** | One vehicle collects from several SHGs on a route | Dense SHG clusters | Cuts pickup cost under real-world freight; *no effect under the case's per-kg tariff* | Yes, for East-UP clusters, *once the rate card is renegotiated* |
| **Shared logistics / 3PL** | Outsourced carriers, part-load (PTL) and full-truck (FTL) | Variable volumes | Volume-based rates | Tender a 3PL rate card before Oct 2027 to replace flat per-kg bands [HYPOTHESIS] |
| **B2B distribution / retail replenishment** | Scheduled replenishment to stores | Staples, repeat demand | ₹10/kg in the case | **Core for the 5 staples** |

### 8.2 SHG-to-AC allocation framework
**Decision rule per SHG.** Assign it to the AC that **minimises total monthly landed cost**:
`units × weight × band rate` + pickup cost + handling cost.
Subject to:
1. **AC capacity** (storage and dispatch, in kg per month): unknown, must be collected.
2. **Product-specific infrastructure** (food-safety-compliant storage for food; protective packing for fragile craft).
3. **Viability floor**: neither AC's secure markup should fall below its fixed opex.
4. **Transition cost**: a re-link requires saving > 0 *and* no tie.
5. **Tie rule**: if the band is the same, keep the current link.

**Granularity.**
- Decide at the **SHG level**. Each SHG is one product and one location.
- Check results at the **district level**, so all SHGs in one district share a link unless products differ in infrastructure needs.
- **Do not decide by product category.** Two honey SHGs in Bijnor and Sitapur need different ACs.

**When proximity does not create savings** [CALC]:
- **SHG-19 and SHG-20 (Jhansi):** Lucknow is 180 km closer but in the same ₹30 band, so the saving is ₹0.
- **SHG-06 (Hapur):** 110 km from Bijnor, 10 km past the ₹10 band. Neither AC puts it in ₹10, and its fix is the channel, not the hub.
- **Bands, not kilometres, set cost.** Inbound cost stays the same anywhere inside a band, then jumps at each edge. Re-optimisation must use bands.

**Result** [CALC]:

| SHG | District | Now → Proposed | Band | ₹ saved per unit | ₹ saved per month |
|---|---|---|---|---|---|
| 11 | Sitapur | B→L | 30→10 | 10 | 3,000 |
| 12 | Kanpur Nagar | B→L | 30→10 | 20 | 5,000 |
| 13 | Varanasi | B→L | 40→20 | 20 | 600 |
| 14 | Varanasi | B→L | 40→20 | 20 | 2,400 |
| 15 | Gorakhpur | B→L | 40→20 | 40 | 2,400 |
| 16 | Gorakhpur | B→L | 40→20 | 100 | 15,000 |
| 17 | Siddharthnagar | B→L | 40→20 | 20 | 14,000 |
| **Total** | | | | | **42,400** |

**Effect on each AC:**
- **Lucknow** grows from 1,640 to 3,250 units a month and from 1,370 to 3,490 kg (+155%). A **capacity check is needed**.
- **Bijnor** shrinks to 2,850 units and 2,400 kg.
- **Phasing:** SHG-16 and SHG-17 together deliver 68% of the savings. Re-link them first.

### 8.3 Third AC, satellite points, or neither?
- **East UP** (SHG-13 to 18) ships 1,845 kg a month. Even if a new hub put every one of those SHGs in the ₹10 band, **the maximum inbound saving is ₹18,450 a month** [CALC].
- **Bundelkhand** (SHG-19, 20): **₹4,400 a month** maximum.
- A third AC is justified only if its **full monthly cost** (rent, staff, utilities, packaging, management) is **below ₹18,450**.
- That is roughly **1.4 minimum-wage salaries** (₹13,190 a month, Category II districts, Oct 2026 [EXT-S29]).
- **Verdict:** *not justified now.* **Trigger for review:** an East-UP hub pays for itself when East-UP inbound volume × ₹10/kg exceeds the hub's monthly opex. For example, a hub costing ₹1 lakh a month needs about 10,000 kg a month, **about 5.4× today's volume** [CALC, illustrative opex].
- **Satellite collection points** (CLF offices, Prerna stores) cost almost nothing and help consolidate pickups. They change *cost* only after the rate card moves from flat per-kg bands to route-based PTL/FTL pricing.

---

## 9. Channel and market-linkage research

### 9.1 Channel assessment (qualitative; numbers only where sourced)
| Channel | Acquisition | Order size | Logistics cost (case) | Payment cycle | Margin notes | Best-fit Prerna products | Key risks |
|---|---|---|---|---|---|---|---|
| Online marketplaces (Amazon, Flipkart, Meesho) | Platform traffic; MoUs exist [EXT-S24] | 1 unit | ₹50+ per order | Platform settlement (collect) | **Commissions not in the case** | Premium, GI, gifting (02, 03, 07, 08, 13, 14, 15, 19, 20) | Return-to-origin and returns [EXT-S30, S38]; breakage |
| ONDC / eSARAS / Prerna Mart | ONDC buyer apps (11+) [EXT-S03, S24] | 1 unit | ₹50+ per order | Varies by seller network participant | Lower commissions than legacy marketplaces [EXT-S31 official] | Same as above; hampers | Uneven seller-participant support [EXT-S31b] |
| **Prerna Saras stores (543)** | State-owned | Cartons | ₹10/kg | Internal | Store margin policy needed | **Staples 01, 05, 06, 09, 16**; papad, dona, jute | Sell-through unknown; staff incentive |
| GeM SARAS / institutional | Government buyers [EXT-S25] | Bulk | ₹10/kg | Government cycles (collect) | Price discovery against GeM peers | Staples (grocery & pantry); dona-pattal; jute bags; gifting | Tender documentation; working capital |
| Corporate gifting (SARAS Shakti, CSR) | B2B sales effort | Hamper batches | Bulk or online | B2B terms | Premium | GI hampers (13, 14, 15, 17, 03) | Seasonal (Diwali, Holi) |
| Prerna Canteens / hotels and restaurants | Local B2B | Bulk | ₹10/kg | Weekly or monthly | Tight | Jaggery, mustard oil, atta, masala | Quality consistency |
| Exhibitions / SARAS melas / ODOP MDA | Event footfall | Mixed | Event logistics | Cash | High-margin retail | Crafts; demand discovery | Episodic |
| Quick commerce (Blinkit, Zepto) [EXT-S34] | Platform | 1 unit | Dark-store replenishment (bulk-like) | Platform | Unknown | Honey, ghee, masala (later) | Onboarding requirements; volume needs |

### 9.2 Online vs bulk decision rule
For each product, at its cheapest AC:
1. **Online-eligible** if `Market − (1.15 × SHG price + inbound) ≥ online outbound`. This is the same as max online markup ≥ 15%. For a buffer against tariff drift, require ≥ 20% [ASSUMPTION].
2. **Bulk-eligible** if `Market − (1.15 × SHG price + inbound + ₹10 × kg) ≥ resale headroom`. The resale headroom is whatever the B2B buyer needs. *Unknown*; set per channel (Prerna store margin policy) [ASSUMPTION].
3. **If both qualify, keep online** when the product gains from story, reviews, gifting or national reach, so long as volume holds. **Online can create more value despite the higher delivery cost** when:
   - margins are high (saree ₹810 headroom per unit);
   - demand is national and niche (GI crafts are not stocked in UP block-level stores);
   - order values are high enough that ₹50 is under ~5% of SP;
   - customer data and reviews build the brand.
4. **If neither qualifies:** re-link first, then hamper or pack redesign. If it still fails, it needs a premium move or a cost review, never a cut in women's pay.

**Bulk absorption check.** The five staples moving to bulk add **2,250 units a month**. Spread over 543 stores that is **~4.1 units per store per month** [CALC]. It is plausible in principle, but store-level sell-through must be validated in the pilot [HYPOTHESIS].

---

## 10. Financial sustainability

### 10.1 Definitions (for the Excel model)
- **Selling price** = SHG price + inbound + markup + outbound (customer-facing).
- **SHG price** = SHG's cost + SHG profit (the women's income pool).
- **AC markup / revenue** = 15% × SHG price × units. **This is the AC's only income line.** Logistics is a pass-through.
- **AC variable cost (not in case):** packaging, handling labour, marketplace commission, payment fees, damages, return-to-origin. *Must be collected.*
- **AC gross contribution** = markup − AC variable costs.
- **AC fixed opex (not in case):** rent, salaries, utilities, IT, insurance, audits.
- **Operating profit** = contribution − fixed opex.
- **Break-even volume** = fixed opex ÷ contribution per unit (product mix-weighted).

### 10.2 What the numbers do and don't say [CALC]
| | Bijnor S0 | Bijnor S3 | Lucknow S0 | Lucknow S3 |
|---|---|---|---|---|
| Linked SHGs | 15 | 8 | 5 | 12 |
| Gross markup (₹/month) | 1,57,500 | 83,400 | 61,800 | 1,35,900 |
| *Secure* markup (competitive products only) | 75,900 | **83,400** | 49,800 | **1,35,900** |
| Logistics outlay the AC must pre-fund | 3,38,800 | 87,500 | 63,100 | 1,63,500 |
| Max fixed opex coverable (≈ secure markup, *before* variable costs) | 75,900 | 83,400 | 49,800 | 1,35,900 |
| ≈ minimum-wage staff-months (₹13,190 [EXT-S29]) | 5.8 | 6.3 | 3.8 | 10.3 |

- **Reading 1:** under Option B, **both ACs hold more secure revenue than they do today.**
- **Reading 2:** whether that revenue covers costs is **unknown**. At about 6 staff-salaries' worth, **Bijnor's markup is tight** for a warehouse that also has to pay packaging, rent and marketplace fees. Option B therefore includes a **Bijnor volume plan**: onboard west-UP SHGs within 100 km (₹10 band), for example around PMFME-ODOP clusters (Meerut jaggery, Moradabad honey [EXT-S07]) [HYPOTHESIS]. It also includes a decision rule: if the opex data show a deficit, UPSRLM chooses explicitly between (a) a time-bound, declining **fixed-cost grant** (not a logistics subsidy) and (b) a markup revision on high-headroom products. Women's SHG price is not touched.

### 10.3 Working capital [CALC, ASSUMPTION]
This assumes the AC pays SHGs on receipt and pays logistics on dispatch, and collects cash after *t* days:

| Cycle *t* | S0 need | S3 need |
|---|---|---|
| 15 days | ₹9.3 lakh | ₹8.6 lakh |
| 30 days | ₹18.6 lakh | ₹17.1 lakh |
| 45 days | ₹28.0 lakh | ₹25.7 lakh |

SHG payouts (₹14.62 lakh a month) dominate, so the payment terms with marketplaces and buyers matter more than freight. Possible sources: CLF working capital and PMFME seed capital (for food SHG members) [EXT-S04, S05]. GeM Sahay offers collateral-free working capital loans for *eligible proprietorship sellers* [EXT-S26], so it may not apply to federations; check.

### 10.4 Financial data UPSRLM must collect before October 2027
1. AC fixed costs: rent, salaries (headcount by role), utilities, IT, insurance, audit.
2. AC variable costs per unit: packaging by SKU, handling, marketplace commission by platform, payment fees, damages, return-to-origin rate and cost.
3. Capacity in kg and units a month (storage and dispatch) for each AC.
4. Payment terms by channel (days to cash) and SHG payout terms.
5. 12 months of actual orders by SKU, channel, platform and pin code, including returns.
6. The actual logistics invoices the state has paid, to compare against the case rate card.
7. SHG cost sheets: materials and labour inside the SHG price.
8. Member-level payouts by month.
9. Benchmark price source, date and channel (retail vs wholesale) for each SKU.
10. GST status and treatment for the ACs.

### 10.5 Conceptual AC P&L (monthly; template for the Excel model)
```
Revenue
  Gross merchandise value (Σ SP × units)                   [pass-through view]
  less: SHG payouts (Σ SHG price × units)
  less: logistics recovered & paid (inbound + outbound)    [nets to zero if actual = rate card]
  = AC markup revenue (Σ 0.15 × SHG price × units)
Variable costs (to collect): packaging · handling · marketplace commission · payment fees · damages/RTO
  = Gross contribution
Fixed costs (to collect): rent · salaries · utilities · IT/software · insurance · audit · admin
  = Operating profit (EBITDA proxy)
Memo: logistics variance (actual invoices − rate-card recovery) · working capital days · break-even units
```

---

## 11. Social impact and women's economic empowerment

### 11.1 Baseline [CALC]
- **Participation:** 127 of 213 members earn (**59.6%**). **86 women (40.4%) earn nothing** from their SHG's Prerna product.
- **Income per earning woman:** mean ₹1,423, median ₹1,050, min ₹400 (papad SHG-04), max ₹7,500 (saree SHG-13).
- **Concentration:** the top 20% of earning women (25 women) take **48.9%** of income. Gini is **0.42** among earners and **0.66** across all members.
- **Pay–participation trade-off (correlation −0.74):**
  - **"Skill-gated crafts"** (7 SHGs: 03, 07, 08, 13, 14, 15, 20): 72 members, **25 earning (34.7%)**, ~₹3,506 per earner.
  - **"Volume-thin" food and other SHGs** (13 SHGs): 141 members, **102 earning (72.3%)**, ~₹913 per earner.
- **SHGs below 50% participation:** 03, 07, 08, 13, 14, 15, 20 (every craft SHG). **Full participation:** 04 papad and 10 dona-pattal, which are also the two lowest-paid (₹400 and ₹480).
- **Who is left behind:**
  1. 86 non-earning members, concentrated in craft SHGs (47 of the 86).
  2. Women in SHGs that are uncompetitive after October 2027: 69 earners and 108 members, concentrated in **east and central UP SHGs linked to Bijnor** and **staple producers selling online**.
  3. Women in high-participation, low-value SHGs who earn only ₹400–600 a month.
- **Lakhpati gap:** no woman earns ₹10,000 a month from this product, though Lakhpati is a *household* measure [EXT-S17]. **What we cannot infer:** individual women's actual earnings (equal split is an assumption), other income sources, hours worked, or who controls the income.

### 11.2 Why some members do not participate [HYPOTHESIS: all need field validation]
| Possible cause | Signal in data | Validation method |
|---|---|---|
| Skill gaps (weaving, zari, chikan, terracotta) | Low participation concentrated in crafts | Skills census by member |
| Demand limits (orders fit 2–5 workers) | Fixed volumes; volume test shows craft SHGs need +67–300% volume to reach 80% | Order book vs capacity per woman |
| Time constraints (care work, farm seasons) | – | Time-use survey |
| Equipment (looms, kilns, sewing machines) | – | Asset inventory |
| Unequal work allocation / elite capture | High-value SHGs with 2–4 earners | Work-allocation records; focus groups |
| Working capital for raw materials | – | SHG cash-flow review |
| Product complexity (single-SKU SHGs) | Each SHG has one product | Diversification potential |

### 11.3 Inclusion test: why demand comes first [CALC]
At today's volumes, adding earners **dilutes** per-woman income, because the SHG profit pool is fixed. To bring every SHG to at least 80% participation **at today's per-woman income** needs:
- **+50 earning women**;
- **+1,679 units a month (+27.5%)**;
- the saree SHG alone would need **4×** its current volume.

**Do not count women "trained" as women "earning".** Training without orders only spreads the same income more thinly.

### 11.4 Framework: "Har Didi Ki Kamai" (every member earns)
1. **Split craft work into tasks.** Break crafts into steps (pre-loom preparation, finishing, embroidery prep, packing, QC, cataloguing) so new entrants earn while they learn. A master artisan trains two apprentices. Funding: **ODOP Skill Development & Toolkit** [EXT-S08] and PMFME capacity building for food [EXT-S05].
2. **Headroom-for-inclusion pricing.** On D2C products with more than 10% headroom (02, 03, 08, 13), the SHG may raise its price so that SP lands at 90% of market [ASSUMPTION: volume holds; test online first].
   - Potential: **+₹29,700 a month of SHG income and +₹4,450 a month of AC markup** [CALC].
   - Condition: because the gain would otherwise go to already-higher earners (saree women from ₹7,500 to ₹11,152), the price rise is approved **only with an inclusion compact**. A share funds apprentice stipends and the SHG commits to a participation target.
3. **Build demand for high-participation, low-value SHGs.** Move them into bulk through Prerna stores, GeM and canteens, so volume rises and income per woman rises without anyone being excluded.
4. **Pay by patronage, transparently.** Adopt the PG rule (pay in proportion to work; corpus share) and a **member passbook** recorded in LokOS/DAR [EXT-S04, S27].
5. **AC jobs for members.** Recruit packers, QC staff and catalogue assistants from non-earning members of linked SHGs.
6. **Working capital and tools.** PMFME seed capital (₹40,000 per member) for food-SHG members entering production [EXT-S05]; MUDRA Shishu for individual equipment [EXT-S13].

### 11.5 Social-impact KPI framework
| # | KPI | Definition | Baseline [CALC] | Target (illustrative, to agree with UPSRLM) | Source |
|---|---|---|---|---|---|
| 1 | Total members | Σ members of linked SHGs | 213 | No SHG dropped | LokOS |
| 2 | Actively earning members | Members with Prerna payout > 0 in the month | 127 | 160 by Sep 2028 | Member ledger |
| 3 | Participation rate | 2 ÷ 1 | 59.6% | ≥ 75% | Calc |
| 4 | Mean income per earning woman | Σ payouts ÷ earners | ₹1,423 | ≥ +25% real | Ledger |
| 5 | **Median** income per earning woman | Median of member payouts | ₹1,050 (equal-split assumption) | ≥ ₹1,500 | Ledger (actual) |
| 6 | Distribution | Gini (all members); top-20% share; P10/P90 | 0.66; 48.9% | Gini ≤ 0.50 | Ledger |
| 7 | Women trained | Completed training | n/a | – | Training MIS |
| 8 | Women **entering production** | Trained → first payout within 90 days | n/a | ≥ 60% conversion | Ledger + MIS |
| 9 | SHGs with zero sales | Linked SHGs with 0 units in month | 0 | 0 | Orders |
| 10 | Income growth & stability | 6-month CAGR; months with payout ÷ 6 | n/a | ≥ 5 of 6 months | Ledger |
| 11 | Products competitive | SP ≤ market (and ≥ 5% headroom) | 10 of 20 (≥5%: 9) | 20 of 20 (≥5%: 16+) | Prerna 360 |
| 12 | Women's income at risk | Σ income in uncompetitive SHGs | ₹75,400 | ₹0 | Prerna 360 |

---

## 12. Strategic options

### Option A: Optimised two-AC model (re-linking only) = S1
- **What:** re-link 7 SHGs to Lucknow; no channel change.
- **Result [CALC]:**
  - 15 of 20 competitive;
  - 5 staples still fail (01, 05, 06, 09, 16), covering 56 members and 41 earners;
  - ₹35,500 a month of income and ₹42,900 of markup still at risk;
  - logistics outlay −10.5%.
- **Pros:** fastest, no new buyers, no capex.
- **Cons:** leaves the courier problem unsolved, and it is the staple SHGs (highest participation) that stay exposed.

### Option B (recommended): "Right Hub, Right Channel" two-AC model with demand aggregation = S3 (+S4, S5 add-ons)
- **What:**
  - re-link 7 SHGs;
  - move 5 staples to bulk through Prerna stores, GeM and canteens;
  - premium/GI online with hampers;
  - headroom-for-inclusion compact;
  - member-level income tracking;
  - Bijnor west-UP volume plan;
  - opex data collection and a transparent viability decision rule.
- **Result [CALC]:**
  - **20 of 20 competitive**;
  - ₹0 markup or income at risk;
  - logistics outlay **−37.5%**;
  - both ACs' secure revenue up;
  - with hampers, outbound falls a further ₹15,000 a month.
- **Cons:**
  - depends on **new bulk demand of 2,250 units a month**, which must be validated;
  - Lucknow capacity grows by +155% kg;
  - 7 products remain under 5% headroom.

### Option C: Hybrid regional model (third East-UP hub or direct-dispatch for East-UP online)
- **What:** an East-UP hub, *or* AC-certified SHG direct dispatch for online orders. Under direct dispatch the AC keeps QC, listing and markup, but the SHG ships to the customer, so inbound is removed for online units.
- **Result [CALC]:**
  - the hub saves at most **₹18,450 a month** of inbound;
  - direct dispatch for East-UP online items (13, 14, 15, 17) avoids about ₹19,400 a month of inbound *after* re-linking.
- **Pros:** most competitive pricing for the farthest SHGs.
- **Cons:**
  - hub opex is very likely above the saving;
  - it dilutes Lucknow's volume;
  - direct dispatch breaks the case's "all goods to the AC" model and adds risks to quality, packaging and brand consistency;
  - SHGs would need courier accounts.
- **Verdict:** **pilot direct dispatch only after 2028**, with 1–2 GI SHGs, if Option B leaves them under 5% headroom.

### 12.1 Weighted evaluation
Scores are 1–5. They are analyst judgement anchored to the [CALC] results above.

| Criterion | Weight | A | B | C |
|---|---|---|---|---|
| Market competitiveness (products competitive, headroom) | 20% | 3 | 5 | 5 |
| AC financial viability (secure revenue vs unknown opex) | 20% | 3 | 4 | 2 |
| SHG / social impact (income protected, inclusion) | 20% | 2 | 4 | 4 |
| Implementation complexity (inverse) | 15% | 5 | 3 | 2 |
| Time to implement before Oct 2027 | 10% | 5 | 4 | 2 |
| Infrastructure / capex requirement (inverse) | 10% | 5 | 4 | 1 |
| Scalability | 5% | 3 | 4 | 4 |
| **Weighted score (out of 5)** | 100% | **3.50** | **4.05** | **3.00** |

**Why not A:** it leaves the highest-participation SHGs exposed. **Why not C:** it spends capital to solve a problem that re-linking and channel choice already solve, and it weakens AC viability.

---

## 13. Recommended operating model: Option B in detail
1. **Hub rule.** Allocate each SHG to its cheapest band; keep the current link on ties (SHG-19, 20). Re-optimise quarterly in Prerna 360.
2. **Channel rule.** Per §9.2. Five staples go to bulk; premium and GI products stay online; hampers for 0.5 kg food.
3. **Price rule.** Keep the 15% markup by default. Apply headroom-for-inclusion (§11.4) to D2C products with more than 10% headroom. **Never lower the SHG price to reach competitiveness.**
4. **Demand rule.** No channel switch without a pilot: store or buyer commitments for at least 3 months of volume.
5. **Viability rule.** Monthly AC P&L. If the secure markup does not cover opex, use a declining fixed-cost grant (12–18 months) plus the Bijnor volume plan. Never a hidden logistics subsidy.
6. **Inclusion rule.** Each SHG has a participation target; price-headroom gains are tied to an inclusion compact.
7. **Data rule.** Every number on a dashboard traces to a transaction or to a labelled assumption (Prerna 360).

**Trade-offs made explicit:**
- **Bijnor hands over ₹74,100 a month of *gross* markup**, but ends with **+₹7,500 more *secure* markup**.
- **Buyers** pay less, because logistics cost drops ₹1.51 lakh a month.
- **Women's per-unit pay is unchanged** in the core model and rises under the headroom compact.
- **The state's subsidy ends**, as policy requires. Any temporary support is limited to AC fixed costs, is time-bound and is visible.

---

## 14. Implementation roadmap to October 2027 (pilot-first)
| Phase | Window | Key actions | Exit gate |
|---|---|---|---|
| **0. Data & design** | Dec 2026 – Jan 2027 | Collect §10.4 data; validate benchmarks (honey ₹290 vs ₹350; kala namak GI tier); confirm Varanasi distance band; AC capacity audit; stakeholder workshops with both federations | Data pack complete; AC P&Ls drafted |
| **1. Pilot** | Feb – Apr 2027 | Re-link **SHG-16 and SHG-17** (68% of savings); bulk pilot for **jaggery and mustard oil** in 25–30 Prerna stores and 2 canteens; hampers on ONDC/eSARAS; *shadow pricing* (compute post-Oct-2027 SP for all SKUs) | Pilot volumes ≥ 90% of baseline; store sell-through ≥ target; zero late SHG payouts |
| **2. Scale** | May – Jul 2027 | Re-link the remaining 5 SHGs; contract bulk for 05, 06, 16; GeM SARAS listings; inclusion cohort 1 (craft task-splitting, 20 women); Bijnor west-UP onboarding drive | 18 of 20 SHGs on target links and channels; Lucknow capacity OK |
| **3. Dress rehearsal** | Aug – Sep 2027 | Run both ACs on a **shadow P&L** (as if paying logistics; state reimburses); test working-capital lines; finalise any fixed-cost grant | Both ACs' contribution ≥ opex, or grant approved; go/no-go by UPSRLM |
| **4. Go-live & stabilise** | Oct 2027 – Mar 2028 | Cost-reflective pricing live; monthly business reviews; quarterly re-optimisation | KPIs §11.5 on track |

**Expansion conditions:** a new AC or district is added only when (i) both ACs are cash-positive for 3 consecutive months, (ii) participation reaches ≥ 70%, and (iii) the third-AC trigger in §8.3 is met.

### 14.1 Governance and responsibilities
| Level | Body | Responsibilities |
|---|---|---|
| State | **Prerna Steering Committee** (UPSRLM MD, marketing head, finance, GDi) | Policy: hub, channel, price and inclusion rules; grant decisions; marketplace partnerships; quarterly review |
| District | District Mission Manager + DIC (ODOP) | SHG re-linking communication; scheme convergence (PMFME, ODOP MDA); Prerna store sell-through |
| AC | AC Manager + federation board | Monthly P&L; capacity; QC; payouts within N days; buyer relationships |
| Federation (CLF) | Accountant, enterprise committee | Working capital; member ledgers; audit |
| SHG | Leader and book-keeper | Production plans; quality; member passbooks; inclusion targets |
| Partners | Marketplaces, 3PL, institutional buyers | SLAs, rate cards, payment terms |

**Routines:**
- monthly business review per AC (P&L, competitiveness, payouts);
- SHG scorecards (volume, quality, participation, on-time supply);
- member-level income tracking;
- buyer CRM;
- quarterly quality audits;
- a grievance line for SHGs and members;
- annual third-party financial audit published to federations.

---

## 15. Risks and mitigation
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bulk demand for staples does not materialise | Medium | High | Pilot-first; pre-commitments; GeM and canteens; keep hampers online as a fallback |
| Lucknow capacity overload (+155% kg) | Medium | Medium | Phase the re-links; capacity audit; cross-dock bulk |
| Bijnor revenue erosion and staff cuts | Medium | High | Show the secure-revenue comparison; west-UP onboarding; time-bound fixed-cost grant |
| Logistics tariff inflation (10% flips 3 products) | Medium | Medium | Tender a 3PL rate card; ≥ 5% headroom buffer; premium positioning |
| Band-boundary interpretation (Varanasi 300 km) | Low–Med | Medium (SHG-14) | Confirm the rule; route SHG-14 to gifting or hampers |
| Benchmarks wrong or outdated | Medium | High | Re-validate quarterly; record source and date |
| Return-to-origin, returns and commissions not modelled | High | Medium | Collect platform data; prefer prepaid; ONDC/eSARAS where cheaper |
| SHG resistance to re-linking | Low–Med | Low | Show per-unit savings; no change in SHG price |
| Elite capture of price gains | Medium | Medium | Inclusion compact; patronage ledger; grievance redressal |
| Working-capital stress | Medium | High | CLF lines; PMFME seed capital; payment-term negotiation |
| Data quality and privacy | Medium | Medium | Prerna 360 validation rules; DPDP-compliant design |

---

## 16. Assumptions and data limitations (summary; full list in Register 4)
1. Case rule 6 ("SP above market = struggles to sell") is used as a binary test. In reality demand is a curve.
2. Income is split equally among earners (case rule 7). Actual splits are unknown.
3. Bands are inclusive at the top: 300 km is in the ₹20 band and 500 km in the ₹30 band.
4. Unit weight includes packaging.
5. The bulk SP is compared with the same market benchmark (as the case instructs). Resale headroom is shown separately.
6. Volume stays constant across channel and AC changes (S1–S4) and under the price changes in S5.
7. Hamper scenario: two 0.5 kg food items per parcel.
8. Working-capital scenario: pay on receipt, collect after *t* days.
9. Minimum-wage staff equivalents are only a yardstick, not an opex estimate.
10. The weighted scores are analyst judgement.

---

## 17. References
See `06_Source_Register.md` for the full register (URL, publisher, date, use). Key sources: Business Standard (16 Sep 2026); PIB eSARAS factsheet (1 Jul 2026); DAY-NRLM PG Advisory; PIB/MoFPI PMFME; Lok Sabha USQ 493 (28 Nov 2024); UP ODOP portal and MSME1Connect; Lok Sabha AU1132 (SFURTI); PIB MUDRA (29 Oct 2024); NABARD Annual Report 2023-24; Rajya Sabha SQ 363 (4 Apr 2025, Lakhpati Didi); 3ie DAY-NRLM flyer (Feb 2026); Kudumbashree; PIB LokOS (4 Jul 2026); Rajya Sabha USQ 2537 (21 Mar 2025); Lok Sabha AU1260 (GeM SARAS); UP minimum wage notification (21 Oct 2026, via TeamLease RegTech).
