# Independent recompute of every deck figure from the raw case dataset and case rules.
import math, json, statistics, openpyxl, sys

SRC = sys.argv[1]
ws = openpyxl.load_workbook(SRC, data_only=True)["SHG Data"]
rows = list(ws.iter_rows(min_row=2, values_only=True))
D = []
for r in rows:
    if not r[0]:
        continue
    D.append(dict(id=r[0], dist=r[1], mem=int(r[2]), act=int(r[3]), dB=r[4], dL=r[5], ac=r[6], prod=r[7], kg=r[8],
                  P=r[9], prof=r[10], u=int(r[11]), ch=r[12], mkt=r[13]))
assert len(D) == 20
MK = 0.15

def band(km):  # band edge belongs to lower band
    return 10 if km <= 100 else 20 if km <= 300 else 30 if km <= 500 else 40

def inbound(d, ac):
    return band(d["dB"] if ac == "Bijnor" else d["dL"]) * d["kg"]

def courier(kg):
    return 50 + 25 * max(0, math.ceil(kg - 1 - 1e-9))

def outbound(d, ch, kg=None):
    kg = d["kg"] if kg is None else kg
    return courier(kg) if ch == "Online" else 10 * kg

def sp(d, ac, ch, mk=MK):
    return d["P"] + inbound(d, ac) + mk * d["P"] + outbound(d, ch)

O = {}
# ---- Q1 baseline
base = {}
for d in D:
    s = sp(d, d["ac"], d["ch"])
    base[d["id"]] = dict(sp=s, gap=(s - d["mkt"]) / d["mkt"] * 100, comp=s <= d["mkt"])
O["example_honey_SHG02_sp"] = base["SHG-02"]["sp"]
unc = [d for d in D if not base[d["id"]]["comp"]]
O["uncompetitive_n"] = len(unc)
O["gaps"] = {d["prod"] + "|" + d["id"]: round(base[d["id"]]["gap"], 1) for d in D}
mk_u = {d["id"]: MK * d["P"] * d["u"] for d in D}
inc_u = {d["id"]: d["prof"] * d["u"] for d in D}
O["markup_total"] = sum(mk_u.values())
O["markup_at_risk"] = sum(mk_u[d["id"]] for d in unc)
O["income_at_risk"] = sum(inc_u[d["id"]] for d in unc)
O["women_in_unc"] = sum(d["act"] for d in unc)
hi = [d for d in unc if base[d["id"]]["gap"] > 5]; lo = [d for d in unc if base[d["id"]]["gap"] <= 5]
O["markup_gt5"] = sum(mk_u[d["id"]] for d in hi); O["markup_0_5"] = sum(mk_u[d["id"]] for d in lo)
O["income_gt5"] = sum(inc_u[d["id"]] for d in hi); O["income_0_5"] = sum(inc_u[d["id"]] for d in lo)
O["unc_all_online"] = all(d["ch"] == "Online" for d in unc)
O["bulk_all_comp"] = all(base[d["id"]]["comp"] for d in D if d["ch"] == "Bulk")
O["courier_ge30pct"] = sorted(d["prod"] for d in unc if outbound(d, d["ch"]) >= 0.3 * d["P"])
O["bijnor_far_380_650"] = sorted(d["prod"] for d in unc if d["ac"] == "Bijnor" and 380 <= d["dB"] <= 650)

# ---- Q2 re-link
best = {}
for d in D:
    b_now = band(d["dB"] if d["ac"] == "Bijnor" else d["dL"])
    alt = "Lucknow" if d["ac"] == "Bijnor" else "Bijnor"
    b_alt = band(d["dL"] if alt == "Lucknow" else d["dB"])
    if b_alt < b_now:
        best[d["id"]] = dict(to=alt, frm=b_now, new=b_alt, saving=(b_now - b_alt) * d["kg"] * d["u"], kg=d["kg"] * d["u"])
O["relinks"] = {k: v for k, v in best.items()}
O["relink_saving_total"] = sum(v["saving"] for v in best.values())
O["shg16_17_saving"] = best["SHG-16"]["saving"] + best["SHG-17"]["saving"]
O["shg16_17_share"] = round(O["shg16_17_saving"] / O["relink_saving_total"] * 100, 1)
O["shg16_17_kg"] = best["SHG-16"]["kg"] + best["SHG-17"]["kg"]
d19 = next(d for d in D if d["id"] == "SHG-19"); O["shg19"] = (d19["dB"], d19["dL"], band(d19["dB"]), band(d19["dL"]))
AC1 = {d["id"]: best[d["id"]]["to"] if d["id"] in best else d["ac"] for d in D}
s1 = {d["id"]: sp(d, AC1[d["id"]], d["ch"]) for d in D}
O["comp_after_relink"] = sum(1 for d in D if s1[d["id"]] <= d["mkt"])
still = [d for d in D if s1[d["id"]] > d["mkt"]]
O["still_unc"] = sorted(d["prod"] for d in still)
O["S1_markup_at_risk"] = sum(mk_u[d["id"]] for d in still); O["S1_income_at_risk"] = sum(inc_u[d["id"]] for d in still)
O["S1_women_at_risk"] = sum(d["act"] for d in still)
# zero markup after re-link
for pid in ["SHG-05", "SHG-06", "SHG-16"]:
    d = next(x for x in D if x["id"] == pid)
    z = sp(d, AC1[pid], d["ch"], mk=0)
    O[f"zero_markup_{d['prod']}"] = (z, d["mkt"], round(outbound(d, d["ch"]) / z * 100, 1))
# AC markup by AC
def acstats(acmap):
    st = {}
    for a in ["Bijnor", "Lucknow"]:
        ds = [d for d in D if acmap[d["id"]] == a]
        st[a] = dict(markup=sum(mk_u[d["id"]] for d in ds), units=sum(d["u"] for d in ds), kg=sum(d["kg"] * d["u"] for d in ds))
    return st
AC0 = {d["id"]: d["ac"] for d in D}
O["ac_before"] = acstats(AC0); O["ac_after"] = acstats(AC1)
O["markup_moved"] = O["ac_before"]["Bijnor"]["markup"] - O["ac_after"]["Bijnor"]["markup"]
for a in ["Bijnor", "Lucknow"]:
    m = O["ac_after"][a]["markup"] / O["ac_after"][a]["units"]
    O[f"{a}_markup_per_unit_after"] = round(m, 1); O[f"{a}_units_per_1lakh"] = round(100000 / m)
O["lucknow_units_pct"] = round((O["ac_after"]["Lucknow"]["units"] / O["ac_before"]["Lucknow"]["units"] - 1) * 100, 1)
O["lucknow_kg_pct"] = round((O["ac_after"]["Lucknow"]["kg"] / O["ac_before"]["Lucknow"]["kg"] - 1) * 100, 1)
O["bijnor_markup_change_pct"] = round((O["ac_after"]["Bijnor"]["markup"] / O["ac_before"]["Bijnor"]["markup"] - 1) * 100, 1)

# ---- channels
online_units = sum(d["u"] for d in D if d["ch"] == "Online"); O["online_units"] = online_units
O["bulk_units_today"] = sum(d["u"] for d in D if d["ch"] == "Bulk")
staples = ["SHG-01", "SHG-05", "SHG-06", "SHG-09", "SHG-16"]
O["blanket_units"] = sum(d["u"] for d in D if d["id"] in staples)
O["hybrid_units"] = sum(d["u"] for d in D if d["id"] in ["SHG-06", "SHG-09", "SHG-16"])
O["blanket_pct"] = round(O["blanket_units"] / online_units * 100, 1); O["hybrid_pct"] = round(O["hybrid_units"] / online_units * 100, 1)
def pack(pid, n, f=1.0):
    d = next(x for x in D if x["id"] == pid)
    return round((n * d["P"] + f * n * inbound(d, AC1[pid]) + MK * n * d["P"] + f * courier(n * d["kg"])) / n, 2), d["mkt"]
O["jaggery_3pack"] = pack("SHG-01", 3); O["jaggery_3pack_f110"] = pack("SHG-01", 3, 1.1)
O["gm_4pack"] = pack("SHG-05", 4); O["gm_4pack_f110"] = pack("SHG-05", 4, 1.1)
for pid in ["SHG-16", "SHG-06", "SHG-09"]:
    d = next(x for x in D if x["id"] == pid); b = sp(d, AC1[pid], "Bulk")
    O[f"reseller_room_{d['prod']}"] = round((d["mkt"] - b) / d["mkt"] * 100, 1)
O["staples_markup"] = sum(mk_u[i] for i in staples); O["staples_income"] = sum(inc_u[i] for i in staples)
packm = mk_u["SHG-01"] + mk_u["SHG-05"]; bulkm = sum(mk_u[i] for i in ["SHG-06", "SHG-09", "SHG-16"])
packi = inc_u["SHG-01"] + inc_u["SHG-05"]; bulki = sum(inc_u[i] for i in ["SHG-06", "SHG-09", "SHG-16"])
secured_base = O["markup_total"] - O["S1_markup_at_risk"]
O["hybrid_illustr"] = dict(comp=15 + 2, markup_secured=secured_base + 0.75 * packm + 0.5 * bulkm,
                           income_at_risk_still_overpriced=0.5 * bulki, income_lost_declined_packs=0.25 * packi,
                           women_exposed=sum(d["act"] for d in D if d["id"] in ["SHG-06", "SHG-09", "SHG-16"]))
O["blanket_half"] = dict(markup_at_risk=0.5 * O["staples_markup"], income_at_risk=0.5 * O["staples_income"])
O["strand_C_shg_payout"] = sum(d["P"] * d["u"] for d in D if d["id"] in ["SHG-06", "SHG-09", "SHG-16"])
O["prerna_stores_per_unit"] = (round(O["blanket_units"] / 543, 1), round(O["hybrid_units"] / 543, 1))

# working capital (deck method): hybrid channels incl. multi-packs; bulk share weighted by SHG-price value
bulkset = {d["id"] for d in D if d["ch"] == "Bulk"} | {"SHG-06", "SHG-09", "SHG-16"}
CHH = {d["id"]: ("Bulk" if d["id"] in bulkset else "Online") for d in D}
PACKS = {"SHG-01": 3, "SHG-05": 4}
def out_h(d):
    if CHH[d["id"]] == "Bulk": return 10 * d["kg"]
    if d["id"] in PACKS: n = PACKS[d["id"]]; return courier(n * d["kg"]) / n
    return courier(d["kg"])
shg = sum(d["P"] * d["u"] for d in D)
log = sum((inbound(d, AC1[d["id"]]) + out_h(d)) * d["u"] for d in D)
b_ = sum(d["P"] * d["u"] for d in D if CHH[d["id"]] == "Bulk") / shg
O["wc_shg_payout_lakh"] = round(shg / 1e5, 2); O["wc_logistics_lakh"] = round(log / 1e5, 2)
O["bulk_share_of_value"] = round(b_ * 100, 1)
for n in [30, 60, 90]:
    O[f"wc_{n}d_lakh"] = round((shg + log) * ((1 - b_) * 15 + b_ * n) / 30 / 1e5, 1)

# ---- gift box 2 (Bijnor): honey SHG-02, brass SHG-03, zari SHG-07
box = [next(d for d in D if d["id"] == i) for i in ["SHG-02", "SHG-03", "SHG-07"]]
shgp = sum(d["P"] for d in box); inb = sum(inbound(d, AC1[d["id"]]) for d in box); mk = sum(MK * d["P"] for d in box)
kg = sum(d["kg"] for d in box)
O["box"] = dict(shg=shgp, inbound=inb, markup=mk, pack=40, truck=10 * kg, total=shgp + inb + mk + 40 + 10 * kg,
                online3=sum(sp(d, AC1[d["id"]], "Online") for d in box), market=sum(d["mkt"] for d in box),
                shg_profit=sum(d["prof"] for d in box), brass_units=box[1]["u"], zari_units=box[2]["u"])
O["box"]["below_market_pct"] = round((1 - O["box"]["total"] / O["box"]["market"]) * 100, 1)

# ---- Q4 social
mem = sum(d["mem"] for d in D); act = sum(d["act"] for d in D)
O["members"], O["earning"], O["not_earning"] = mem, act, mem - act
O["earning_pct"] = round(act / mem * 100, 1)
per = [inc_u[d["id"]] / d["act"] for d in D]
women = sorted([inc_u[d["id"]] / d["act"] for d in D for _ in range(d["act"])], reverse=True)
O["median_income_per_earner"] = statistics.median(women)
top = women[: round(len(women) * 0.2)]
O["top20_share"] = round(sum(top) / sum(women) * 100, 1)
part = [d["act"] / d["mem"] for d in D]
mx = statistics.mean(part); my = statistics.mean(per)
O["corr_part_income"] = round(sum((a - mx) * (b - my) for a, b in zip(part, per)) / math.sqrt(sum((a - mx) ** 2 for a in part) * sum((b - my) ** 2 for b in per)), 2)
O["shgs_below_80"] = sum(1 for p in part if p < 0.8)
crafts = ["SHG-03", "SHG-07", "SHG-08", "SHG-13", "SHG-14", "SHG-15", "SHG-20"]
cm = sum(d["mem"] for d in D if d["id"] in crafts); ca = sum(d["act"] for d in D if d["id"] in crafts)
O["craft_pct"] = round(ca / cm * 100, 1); O["other_pct"] = round((act - ca) / (mem - cm) * 100, 1)
add_w = 0; add_u = 0
for d in D:
    need = math.ceil(0.8 * d["mem"] - 1e-9)
    if d["act"] < need:
        extra = need - d["act"]; add_w += extra; add_u += d["u"] / d["act"] * extra
O["add_women_80"] = add_w; O["add_units_80"] = round(add_u); O["add_units_pct"] = round(add_u / sum(d["u"] for d in D) * 100, 1)
O["lowest10"] = sorted([(round(d["act"] / d["mem"], 3), d["prod"], d["id"], d["act"], d["mem"], round(inc_u[d["id"]] / d["act"])) for d in D])[:10]
O["highest2"] = sorted([(round(d["act"] / d["mem"], 3), d["prod"], d["act"], d["mem"], round(inc_u[d["id"]] / d["act"])) for d in D])[-2:]
pilot = ["SHG-16", "SHG-17", "SHG-01", "SHG-05", "SHG-06", "SHG-09", "SHG-02", "SHG-03", "SHG-07", "SHG-14", "SHG-20"]
O["pilot"] = (len(pilot), sum(d["mem"] for d in D if d["id"] in pilot), sum(d["act"] for d in D if d["id"] in pilot))
print(json.dumps(O, indent=1, ensure_ascii=False, default=str))

