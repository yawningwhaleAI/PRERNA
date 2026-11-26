"""
Prerna Aggregation Centres - deterministic calculation engine
=============================================================
Reads the ORIGINAL case dataset (never modified) and reproduces every number
used in the research dossier. Each function mirrors one block of the future
Excel workbook / Prerna 360 calculation engine.

Usage:  python3 -I prerna_model.py "<path to Prerna Data Set.xlsx>" <output_dir>

Rules implemented exactly as stated in the case (PDF p.1 and 'Pricing & Costs' sheet):
  SP = SHG price + inbound + AC markup (15% of SHG price) + outbound
  Inbound  = weight x Rs10/20/30/40 per kg for <=100 / 101-300 / 301-500 / >500 km
             (distance 0 km is charged the <=100 km band - confirmed by the case's honey example)
  Outbound online = Rs50 first kg per order + Rs25 per additional kg OR PART (1 unit = 1 order)
  Outbound bulk   = Rs10 per kg
  AC profit  = 15% x SHG price x units sold
  SHG income = SHG profit per unit x units sold, shared only among actively earning women
  Competitive = SP <= market price of a similar product (case rule 6: SP above market -> struggles to sell)
"""
import math
import sys
import json
from pathlib import Path

import pandas as pd

MARKUP = 0.15
BANDS = [(100, 10), (300, 20), (500, 30), (float("inf"), 40)]  # (upper km, Rs/kg)
ONLINE_FIRST_KG, ONLINE_EXTRA_KG, BULK_PER_KG = 50, 25, 10


# ---------------------------------------------------------------- core rules
def inbound_rate(km: float) -> int:
    for upper, rate in BANDS:
        if km <= upper:
            return rate
    raise ValueError(km)


def inbound_cost(weight: float, km: float, rate_mult: float = 1.0) -> float:
    return weight * inbound_rate(km) * rate_mult


def outbound_cost(weight: float, channel: str, rate_mult: float = 1.0, units_per_parcel: int = 1) -> float:
    """Per-UNIT outbound cost. units_per_parcel>1 models a bundle/hamper (scenario only)."""
    if channel == "Bulk":
        return BULK_PER_KG * weight * rate_mult
    parcel_kg = weight * units_per_parcel
    extra = max(0, math.ceil(round(parcel_kg - 1, 9)))
    return (ONLINE_FIRST_KG + ONLINE_EXTRA_KG * extra) * rate_mult / units_per_parcel


def selling_price(row, ac: str, channel: str, markup=MARKUP, in_mult=1.0, out_mult=1.0, upp=1):
    km = row["dist_bijnor"] if ac == "Bijnor" else row["dist_lucknow"]
    inb = inbound_cost(row["weight"], km, in_mult)
    mk = markup * row["shg_price"]
    outb = outbound_cost(row["weight"], channel, out_mult, upp)
    return {"inbound": inb, "markup": mk, "outbound": outb, "sp": row["shg_price"] + inb + mk + outb}


# ---------------------------------------------------------------- load
def load(path):
    df = pd.read_excel(path, sheet_name="SHG Data")
    df.columns = ["shg_id", "district", "members", "active", "dist_bijnor", "dist_lucknow",
                  "linked_ac", "product", "weight", "shg_price", "shg_profit", "units",
                  "channel", "market_price"]
    return df


CATEGORY = {  # analyst classification (not in the case) - used for channel/positioning logic
    "Jaggery (1 kg)": "Food staple", "Honey (500 g)": "Food premium", "Brass diya set": "Handicraft",
    "Papad (500 g)": "Food staple", "Garam masala (500 g)": "Food staple",
    "Detergent powder (2 kg)": "Home care (FMCG)", "Zari clutch": "Handicraft",
    "Chikankari kurta": "Textile/apparel", "Mustard oil (1 L)": "Food staple",
    "Dona-pattal (100 pcs)": "Eco-disposables", "Masala combo (1 kg)": "Food staple",
    "Banarasi silk saree": "Textile/apparel", "Wooden toy set": "Handicraft",
    "Terracotta horse": "Handicraft", "Multigrain atta (5 kg)": "Food staple",
    "Kala namak rice (1 kg)": "Food premium (GI)", "Jute bag": "Eco-lifestyle",
    "Ghee (1 L)": "Food premium", "Soft toy": "Handicraft",
}


# ---------------------------------------------------------------- data audit
def audit(df):
    issues = []
    issues.append(("Missing values", int(df.isna().sum().sum()), "No blank cells in SHG Data"))
    issues.append(("Duplicate SHG IDs", int(df.shg_id.duplicated().sum()), "SHG IDs unique"))
    dup_prod = df[df["product"].duplicated(keep=False)][["shg_id", "product", "district", "market_price", "linked_ac"]]
    issues.append(("Same product, different market benchmark", len(dup_prod),
                   dup_prod.to_dict("records")))
    df["profit_pct_of_price"] = df.shg_profit / df.shg_price
    issues.append(("SHG profit as % of SHG price (range)",
                   f"{df.profit_pct_of_price.min():.1%} - {df.profit_pct_of_price.max():.1%}",
                   "Profit is ~12.5% of SHG price for most rows; remainder (cost incl. raw material and possibly wages) not broken down"))
    over = df[df.active > df.members]
    issues.append(("Active > members", len(over), "None"))
    same_district_diff_ac = (df.groupby("district").linked_ac.nunique() > 1)
    issues.append(("Districts whose SHGs are linked to different ACs",
                   list(same_district_diff_ac[same_district_diff_ac].index), "Legacy linkage inconsistency"))
    boundary = df[(df.dist_bijnor.isin([100, 300, 500])) | (df.dist_lucknow.isin([100, 300, 500]))]
    issues.append(("Distances exactly on a band boundary", boundary[["shg_id", "dist_bijnor", "dist_lucknow"]].to_dict("records"),
                   "Interpreted as the lower band ('up to 100', '101-300', '301-500')"))
    return issues


# ---------------------------------------------------------------- baseline
def baseline(df):
    rows = []
    for _, r in df.iterrows():
        cur = selling_price(r, r.linked_ac, r.channel)
        alt_ac = "Lucknow" if r.linked_ac == "Bijnor" else "Bijnor"
        alt = selling_price(r, alt_ac, r.channel)
        rec = dict(
            shg_id=r.shg_id, district=r.district, product=r["product"], category=CATEGORY[r["product"]],
            linked_ac=r.linked_ac, channel=r.channel, weight=r.weight, units=r.units,
            shg_price=r.shg_price, market=r.market_price,
            value_density=r.shg_price / r.weight,
            km_linked=r.dist_bijnor if r.linked_ac == "Bijnor" else r.dist_lucknow,
            band_rate_linked=inbound_rate(r.dist_bijnor if r.linked_ac == "Bijnor" else r.dist_lucknow),
            band_rate_bijnor=inbound_rate(r.dist_bijnor), band_rate_lucknow=inbound_rate(r.dist_lucknow),
            inbound=cur["inbound"], markup=cur["markup"], outbound=cur["outbound"], sp=cur["sp"],
        )
        rec["gap"] = rec["sp"] - r.market_price                  # +ve = more expensive than market
        rec["headroom_pct"] = (r.market_price - rec["sp"]) / r.market_price
        rec["competitive"] = rec["sp"] <= r.market_price
        rec["logistics_share_of_sp"] = (rec["inbound"] + rec["outbound"]) / rec["sp"]
        rec["logistics_pct_of_shg_price"] = (rec["inbound"] + rec["outbound"]) / r.shg_price
        # AC economics
        rec["ac_markup_month"] = rec["markup"] * r.units
        rec["ac_inbound_spend_month"] = rec["inbound"] * r.units
        rec["ac_outbound_spend_month"] = rec["outbound"] * r.units
        rec["gmv_month"] = rec["sp"] * r.units
        rec["kg_month"] = r.weight * r.units
        # best AC on cost
        inb_b = inbound_cost(r.weight, r.dist_bijnor)
        inb_l = inbound_cost(r.weight, r.dist_lucknow)
        rec["inbound_bijnor"], rec["inbound_lucknow"] = inb_b, inb_l
        rec["cheapest_ac"] = "Bijnor" if inb_b < inb_l else ("Lucknow" if inb_l < inb_b else "Tie")
        rec["closer_ac"] = "Bijnor" if r.dist_bijnor < r.dist_lucknow else "Lucknow"
        rec["realloc_saving_unit"] = max(0, rec["inbound"] - min(inb_b, inb_l))
        rec["realloc_saving_month"] = rec["realloc_saving_unit"] * r.units
        rec["mislinked"] = rec["realloc_saving_unit"] > 0
        # channel alternatives at cheapest AC
        best_ac = r.linked_ac if rec["cheapest_ac"] in ("Tie", r.linked_ac) else rec["cheapest_ac"]
        rec["best_ac"] = best_ac
        for ac in ("Bijnor", "Lucknow"):
            for ch in ("Online", "Bulk"):
                rec[f"sp_{ac[0]}_{ch}"] = selling_price(r, ac, ch)["sp"]
        rec["online_minus_bulk_outbound"] = outbound_cost(r.weight, "Online") - outbound_cost(r.weight, "Bulk")
        # max markup that keeps product competitive (best AC, current channel and bulk)
        for ch in ("Online", "Bulk"):
            s = selling_price(r, best_ac, ch, markup=0)
            rec[f"max_markup_pct_{ch}"] = (r.market_price - s["sp"]) / r.shg_price
        # social
        rec["members"], rec["active"] = r.members, r.active
        rec["participation"] = r.active / r.members
        rec["inactive"] = r.members - r.active
        rec["shg_income_month"] = r.shg_profit * r.units
        rec["income_per_active_month"] = rec["shg_income_month"] / r.active
        rec["income_per_member_month_if_shared"] = rec["shg_income_month"] / r.members
        rec["shg_profit_unit"] = r.shg_profit
        rows.append(rec)
    return pd.DataFrame(rows)


# ---------------------------------------------------------------- scenarios
def scenario(df, assign: dict, channel: dict, label, in_mult=1.0, out_mult=1.0, vol_mult=1.0,
             upp: dict | None = None, markup_override: dict | None = None):
    out = []
    for _, r in df.iterrows():
        ac = assign.get(r.shg_id, r.linked_ac)
        ch = channel.get(r.shg_id, r.channel)
        mk = (markup_override or {}).get(r.shg_id, MARKUP)
        u = (upp or {}).get(r.shg_id, 1) if ch == "Online" else 1
        s = selling_price(r, ac, ch, markup=mk, in_mult=in_mult, out_mult=out_mult, upp=u)
        units = r.units * vol_mult
        comp = s["sp"] <= r.market_price
        out.append(dict(scenario=label, shg_id=r.shg_id, product=r["product"], ac=ac, channel=ch,
                        sp=s["sp"], market=r.market_price, competitive=comp,
                        headroom_pct=(r.market_price - s["sp"]) / r.market_price,
                        units=units, markup_rev=s["markup"] * units,
                        inbound_spend=s["inbound"] * units, outbound_spend=s["outbound"] * units,
                        shg_income=r.shg_profit * units, active=r.active, members=r.members))
    return pd.DataFrame(out)


def summarise(sc):
    by_ac = sc.groupby("ac").agg(shgs=("shg_id", "count"), units=("units", "sum"),
                                 markup_rev=("markup_rev", "sum"), inbound=("inbound_spend", "sum"),
                                 outbound=("outbound_spend", "sum"))
    comp = sc[sc.competitive]
    return dict(
        scenario=sc.scenario.iloc[0],
        competitive_count=int(sc.competitive.sum()),
        uncompetitive=list(sc[~sc.competitive].shg_id),
        thin_headroom_lt5pct=list(sc[(sc.competitive) & (sc.headroom_pct < 0.05)].shg_id),
        ac_markup_total=round(sc.markup_rev.sum(), 2),
        ac_markup_at_risk=round(sc[~sc.competitive].markup_rev.sum(), 2),
        ac_markup_secure=round(comp.markup_rev.sum(), 2),
        bijnor_markup=round(by_ac.markup_rev.get("Bijnor", 0), 2),
        lucknow_markup=round(by_ac.markup_rev.get("Lucknow", 0), 2),
        bijnor_markup_secure=round(comp[comp.ac == "Bijnor"].markup_rev.sum(), 2),
        lucknow_markup_secure=round(comp[comp.ac == "Lucknow"].markup_rev.sum(), 2),
        bijnor_shgs=int(by_ac.shgs.get("Bijnor", 0)), lucknow_shgs=int(by_ac.shgs.get("Lucknow", 0)),
        logistics_outlay_total=round(sc.inbound_spend.sum() + sc.outbound_spend.sum(), 2),
        bijnor_logistics_outlay=round(by_ac.inbound.get("Bijnor", 0) + by_ac.outbound.get("Bijnor", 0), 2),
        lucknow_logistics_outlay=round(by_ac.inbound.get("Lucknow", 0) + by_ac.outbound.get("Lucknow", 0), 2),
        shg_income_total=round(sc.shg_income.sum(), 2),
        shg_income_at_risk=round(sc[~sc.competitive].shg_income.sum(), 2),
        women_active_at_risk=int(sc[~sc.competitive].active.sum()),
        members_in_at_risk_shgs=int(sc[~sc.competitive].members.sum()),
    )


def gini(values):
    v = sorted(values)
    n = len(v)
    cum = sum((i + 1) * x for i, x in enumerate(v))
    return (2 * cum) / (n * sum(v)) - (n + 1) / n


def main(data_path, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    df = load(data_path)
    b = baseline(df)
    b.to_csv(out / "01_baseline_product_economics.csv", index=False)

    # ---- data audit
    aud = audit(df.copy())
    with open(out / "00_data_audit.json", "w") as f:
        json.dump([{"check": a, "result": r, "note": n} for a, r, n in aud], f, indent=2, default=str)

    # ---- scenario definitions
    realloc = {r.shg_id: r.best_ac for _, r in b.iterrows() if r.mislinked}
    bulk_candidates = {r.shg_id: "Bulk" for _, r in b.iterrows()
                       if r.channel == "Online" and not (r[f"sp_{r.best_ac[0]}_Online"] <= r.market)
                       and r[f"sp_{r.best_ac[0]}_Bulk"] <= r.market}
    # channel only (no realloc): products uncompetitive online at CURRENT AC but competitive in bulk at current AC
    bulk_only = {r.shg_id: "Bulk" for _, r in b.iterrows()
                 if r.channel == "Online" and not r.competitive and r[f"sp_{r.linked_ac[0]}_Bulk"] <= r.market}
    # hamper assumption: two 0.5 kg food items share one 1 kg parcel (scenario only, demand unvalidated)
    hamper = {r.shg_id: 2 for _, r in b.iterrows() if r.weight == 0.5 and r.category.startswith("Food")}

    scen = {
        "S0 Baseline (current links & channels, logistics now charged)": scenario(df, {}, {}, "S0"),
        "S1 Reallocate mis-linked SHGs only": scenario(df, realloc, {}, "S1"),
        "S2 Channel shift only (bulk for heavy/low-value)": scenario(df, {}, bulk_only, "S2"),
        "S3 Reallocate + channel shift (recommended core)": scenario(df, realloc, bulk_candidates, "S3"),
        "S3a S3 + 20% volume decline": scenario(df, realloc, bulk_candidates, "S3a", vol_mult=0.8),
        "S3b S3 + 10% logistics rate inflation": scenario(df, realloc, bulk_candidates, "S3b", in_mult=1.1, out_mult=1.1),
        "S3c S3 + 20% logistics rate inflation": scenario(df, realloc, bulk_candidates, "S3c", in_mult=1.2, out_mult=1.2),
        "S3d S0 + 20% logistics rate inflation": scenario(df, {}, {}, "S3d", in_mult=1.2, out_mult=1.2),
        "S4 S3 + 2-item hamper parcels for 0.5 kg food (assumption)": scenario(df, realloc, bulk_candidates, "S4", upp=hamper),
    }
    summaries = []
    for name, sc in scen.items():
        s = summarise(sc)
        s["scenario"] = name
        summaries.append(s)
        sc.to_csv(out / f"scenario_{sc.scenario.iloc[0]}.csv", index=False)
    pd.DataFrame(summaries).to_csv(out / "02_scenario_summary.csv", index=False)

    # ---- AC break-even threshold (fixed opex the markup can cover)
    s0, s3 = summaries[0], summaries[3]
    be = pd.DataFrame([
        dict(ac="Bijnor", markup_S0=s0["bijnor_markup"], markup_secure_S0=s0["bijnor_markup_secure"],
             markup_S3=s3["bijnor_markup"], markup_secure_S3=s3["bijnor_markup_secure"]),
        dict(ac="Lucknow", markup_S0=s0["lucknow_markup"], markup_secure_S0=s0["lucknow_markup_secure"],
             markup_S3=s3["lucknow_markup"], markup_secure_S3=s3["lucknow_markup_secure"]),
    ])
    be["note"] = "Max monthly fixed opex coverable by markup (Rs). Actual opex not in case - must be collected."
    be.to_csv(out / "03_ac_breakeven_threshold.csv", index=False)

    # ---- social
    soc = b[["shg_id", "district", "product", "members", "active", "inactive", "participation",
             "shg_income_month", "income_per_active_month", "income_per_member_month_if_shared", "competitive"]]
    soc.to_csv(out / "04_social_baseline.csv", index=False)
    # woman-level distribution (each active woman assumed to earn equal share within her SHG - case rule)
    women = []
    for _, r in b.iterrows():
        women += [r.income_per_active_month] * int(r.active)
        women += [0.0] * int(r.inactive)
    active_only = [w for w in women if w > 0]
    social_summary = dict(
        total_members=int(b.members.sum()), active=int(b.active.sum()), inactive=int(b.inactive.sum()),
        participation=round(b.active.sum() / b.members.sum(), 4),
        total_shg_income_month=float(b.shg_income_month.sum()),
        mean_income_active=round(sum(active_only) / len(active_only), 2),
        median_income_active=float(pd.Series(active_only).median()),
        mean_income_all_members=round(sum(women) / len(women), 2),
        gini_active_only=round(gini(active_only), 4),
        gini_all_members=round(gini(women), 4),
        min_income_active=float(min(active_only)), max_income_active=float(max(active_only)),
        top_quintile_share_of_income=None,
        shgs_participation_below_50pct=list(b[b.participation < 0.5].shg_id),
        shgs_full_participation=list(b[b.participation == 1].shg_id),
        active_women_in_uncompetitive_shgs_S0=int(b[~b.competitive].active.sum()),
        members_in_uncompetitive_shgs_S0=int(b[~b.competitive].members.sum()),
        income_at_risk_S0=float(b[~b.competitive].shg_income_month.sum()),
    )
    s = sorted(active_only, reverse=True)
    k = max(1, round(len(s) * 0.2))
    social_summary["top_quintile_share_of_income"] = round(sum(s[:k]) / sum(s), 4)
    # women below Rs 8,333/month (= Rs 1 lakh/yr) from this product alone
    social_summary["active_women_below_8333_pm_from_this_product"] = sum(1 for w in active_only if w < 100000 / 12)
    with open(out / "05_social_summary.json", "w") as f:
        json.dump(social_summary, f, indent=2)

    # ---- third AC upper-bound saving (east UP cluster, after S3)
    dfk = df.assign(kg_month=df.weight * df.units)
    east = dfk[dfk.district.isin(["Varanasi", "Gorakhpur", "Siddharthnagar"])]
    east_kg = float(east.kg_month.sum())
    bund = dfk[dfk.district == "Jhansi"]
    third = dict(
        east_up_shgs=list(east.shg_id), east_up_kg_month=east_kg,
        east_up_inbound_after_S3=float(sum(inbound_cost(r.weight, r.dist_lucknow) * r.units for _, r in east.iterrows())),
        east_up_max_saving_if_all_moved_to_10_per_kg=float(sum((inbound_rate(r.dist_lucknow) - 10) * r.weight * r.units for _, r in east.iterrows())),
        bundelkhand_shgs=list(bund.shg_id), bundelkhand_kg_month=float(bund.kg_month.sum()),
        bundelkhand_max_saving=float(sum((min(inbound_rate(r.dist_bijnor), inbound_rate(r.dist_lucknow)) - 10) * r.weight * r.units for _, r in bund.iterrows())),
        note="Upper bound: assumes a new hub puts every SHG in the <=100 km band. Compare against unknown monthly fixed cost of a hub.",
    )
    with open(out / "06_third_ac_test.json", "w") as f:
        json.dump(third, f, indent=2)

    # ---- AC-level baseline P&L shell (variable lines only)
    pnl = b.groupby("linked_ac").agg(shgs=("shg_id", "count"), units=("units", "sum"), kg=("kg_month", "sum"),
                                       gmv=("gmv_month", "sum"), markup=("ac_markup_month", "sum"),
                                       inbound=("ac_inbound_spend_month", "sum"), outbound=("ac_outbound_spend_month", "sum"))
    pnl.to_csv(out / "07_ac_baseline_volumes.csv")

    # ---- break-even inbound distance / value-density thresholds for online
    thr = []
    for _, r in b.iterrows():
        thr.append(dict(shg_id=r.shg_id, product=r["product"], value_density=r.value_density,
                        online_outbound=outbound_cost(r.weight, "Online"), bulk_outbound=outbound_cost(r.weight, "Bulk"),
                        online_outbound_pct_shg_price=outbound_cost(r.weight, "Online") / r.shg_price,
                        max_markup_online=r.max_markup_pct_Online, max_markup_bulk=r.max_markup_pct_Bulk))
    pd.DataFrame(thr).to_csv(out / "08_channel_thresholds.csv", index=False)

    # ---- S5 headroom sharing (ASSUMPTION scenario): where S3 headroom > 10%, let SHG raise its price so SP
    #      lands at 90% of market (10% buffer kept). Entire SHG price increase treated as SHG profit (to women).
    #      Online (D2C) only: for bulk, the gap to market is the B2B buyer's resale margin and is left untouched.
    #      Volume held constant - price elasticity unknown, must be tested.
    s3 = scen["S3 Reallocate + channel shift (recommended core)"]
    hs = []
    for _, r in s3.iterrows():
        src = df[df.shg_id == r.shg_id].iloc[0]
        s = selling_price(src, r.ac, r.channel)
        target = 0.90 * r.market
        new_price = (target - s["inbound"] - s["outbound"]) / (1 + MARKUP)
        dP = max(0.0, new_price - src.shg_price) if (r.headroom_pct > 0.10 and r.channel == "Online") else 0.0  # bulk headroom left for B2B resale margin
        hs.append(dict(shg_id=r.shg_id, product=r["product"], s3_sp=r.sp, market=r.market, s3_headroom=r.headroom_pct,
                       shg_price_old=src.shg_price, shg_price_new=src.shg_price + dP, delta_price=dP,
                       extra_shg_income_month=dP * src.units, extra_income_per_active=dP * src.units / src.active,
                       extra_ac_markup_month=MARKUP * dP * src.units,
                       base_income_per_active=src.shg_profit * src.units / src.active))
    hs = pd.DataFrame(hs)
    hs.to_csv(out / "09_headroom_sharing_scenario.csv", index=False)

    # ---- working capital need (ASSUMPTION: AC pays SHG on receipt and logistics on dispatch; cash recovered
    #      after `cycle` days). Parameterised for 15/30/45 days.
    wc = []
    for name, sc in [("S0", scen["S0 Baseline (current links & channels, logistics now charged)"]), ("S3", s3)]:
        shg_pay = sum(df.set_index("shg_id").loc[x, "shg_price"] * u for x, u in zip(sc.shg_id, sc.units))
        logi = sc.inbound_spend.sum() + sc.outbound_spend.sum()
        for cycle in (15, 30, 45):
            wc.append(dict(scenario=name, cycle_days=cycle, monthly_shg_payouts=shg_pay, monthly_logistics=logi,
                           working_capital_need=(shg_pay + logi) * cycle / 30))
    pd.DataFrame(wc).to_csv(out / "10_working_capital_scenarios.csv", index=False)

    # ---- inclusion-volume test: units needed to reach >=80% participation WITHOUT diluting per-woman income
    inc = []
    for _, r in df.iterrows():
        target = max(int(r.active), math.ceil(0.8 * r.members))
        inc.append(dict(shg_id=r.shg_id, product=r["product"], members=r.members, active=r.active, target_active=target,
                        new_women=target - r.active, units_now=r.units, units_needed=r.units * target / r.active,
                        extra_units=r.units * target / r.active - r.units,
                        extra_units_pct=target / r.active - 1))
    inc = pd.DataFrame(inc)
    inc.to_csv(out / "11_inclusion_volume_test.csv", index=False)
    print(json.dumps({"inclusion_new_women": int(inc.new_women.sum()), "inclusion_extra_units": float(inc.extra_units.sum()),
                      "inclusion_extra_units_pct_total": float(inc.extra_units.sum() / inc.units_now.sum()),
                      "inclusion_rows": inc[inc.new_women > 0][["shg_id", "new_women", "extra_units_pct"]].round(2).to_dict("records")}, indent=1))

    # ---- S5b sensitivity: share of the SHG price rise that reaches SHG profit x volume retained
    grid = []
    for share in (0.5, 0.75, 1.0):
        for retain in (0.8, 0.9, 1.0):
            extra = 0.0
            for _, h in hs[hs.delta_price > 0].iterrows():
                src = df[df.shg_id == h.shg_id].iloc[0]
                new_inc = (src.shg_profit + share * h.delta_price) * src.units * retain
                extra += new_inc - src.shg_profit * src.units
            grid.append(dict(profit_share_of_rise=share, volume_retained=retain, net_change_shg_income_month=round(extra, 0)))
    pd.DataFrame(grid).to_csv(out / "12_headroom_passthrough_sensitivity.csv", index=False)

    # ---- S6 corporate / institutional boxes (ASSUMPTION scenario: Prerna 365 / Buyer Club)
    #      Box built ONLY from one AC's own stock (no cross-AC freight). Contents priced at S3 links.
    #      Delivered to the corporate buyer as a consolidated bulk shipment (Rs10/kg), versus one-by-one courier.
    #      Packaging cost per box is unknown -> tested at Rs0/40/80. Benchmark = sum of contents' market prices.
    boxes = {
        "Essentials Festive Box (Bijnor)": ["SHG-01", "SHG-02", "SHG-04", "SHG-05"],
        "Signature Craft Box (Bijnor)": ["SHG-02", "SHG-03", "SHG-07"],
        "Signature Purvanchal Box (Lucknow)": ["SHG-14", "SHG-17", "SHG-20"],
    }
    s3_ac = dict(zip(s3.shg_id, s3.ac))
    box_rows = []
    for name, ids in boxes.items():
        items = df[df.shg_id.isin(ids)]
        acs = {s3_ac[i] for i in ids}
        assert len(acs) == 1, f"{name} mixes ACs"
        kg = float(items.weight.sum())
        base = sum(src.shg_price + inbound_cost(src.weight, src.dist_bijnor if s3_ac[src.shg_id] == "Bijnor" else src.dist_lucknow)
                   + MARKUP * src.shg_price for _, src in items.iterrows())
        mkt = float(items.market_price.sum())
        shg_profit = float(items.shg_profit.sum())
        ac_markup = float(MARKUP * items.shg_price.sum())
        for pack in (0, 40, 80):
            for mode, outb in (("Corporate bulk delivery", BULK_PER_KG * kg),
                               ("Courier, one box per order", outbound_cost(kg, "Online"))):
                sp = base + pack + outb
                box_rows.append(dict(box=name, ac=acs.pop() if False else list(acs)[0], contents=", ".join(items["product"]),
                                     kg=kg, packaging=pack, delivery=mode, box_sp=sp, sum_market=mkt,
                                     headroom_pct=round((mkt - sp) / mkt, 4), shg_profit_per_box=shg_profit,
                                     ac_markup_per_box=ac_markup,
                                     per_1000_boxes_shg_income=shg_profit * 1000, per_1000_boxes_ac_markup=ac_markup * 1000,
                                     months_of_current_output_for_1000=round(max(1000 / u for u in items.units), 2)))
    pd.DataFrame(box_rows).to_csv(out / "13_corporate_box_economics.csv", index=False)
    print(json.dumps({"box_rows": [r for r in box_rows if r["packaging"] == 40]}, indent=1))
    print(json.dumps({"passthrough_grid": grid}, indent=1))

    print(json.dumps({"headroom_sharing_total_extra_income": float(hs.extra_shg_income_month.sum()),
                      "headroom_sharing_extra_ac": float(hs.extra_ac_markup_month.sum()),
                      "headroom_rows": hs[hs.delta_price > 0][["shg_id", "delta_price", "extra_shg_income_month", "extra_income_per_active", "base_income_per_active"]].round(1).to_dict("records"),
                      "wc": wc}, indent=1, default=str))
    print(json.dumps({"summaries": summaries, "social": social_summary, "third_ac": third,
                      "realloc": realloc, "bulk_candidates": bulk_candidates, "bulk_only": bulk_only,
                      "hamper": hamper}, indent=1, default=str))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
