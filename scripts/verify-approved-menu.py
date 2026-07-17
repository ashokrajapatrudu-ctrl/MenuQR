#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_js_assignment(path, variable):
    source = (ROOT / path).read_text()
    match = re.search(rf"{re.escape(variable)}\s*=\s*(\{{.*\}});\s*$", source, re.S)
    if not match:
        raise RuntimeError(f"Could not parse {variable} from {path}")
    return json.loads(match.group(1))


def main():
    menu = parse_js_assignment("menu-data.js", "window.MENU_DATA")
    details = parse_js_assignment("menu-product-details.js", "window.MENU_PRODUCT_DETAILS")
    report = json.loads((ROOT / "menu-import-report.json").read_text())

    errors = []
    item_ids = {item["id"] for item in menu["items"]}
    detail_ids = set(details["items"])
    if len(menu["items"]) != menu["meta"]["itemCount"]:
        errors.append("Product-count comparison failed against menu meta.")
    if len(menu["categories"]) != menu["meta"]["categoryCount"]:
        errors.append("Category-count comparison failed against menu meta.")
    if item_ids != detail_ids:
        errors.append(f"Missing-description check failed: {len(item_ids - detail_ids)} missing, {len(detail_ids - item_ids)} extra.")

    price_mismatches = []
    for item in menu["items"]:
        detail = details["items"].get(item["id"])
        if not detail:
            continue
        if not detail.get("description"):
            errors.append(f"Missing approved description: {item['id']}")
        for index, variant in enumerate(item["variants"]):
            try:
                approved_price = detail["variants"][index]["price"]
            except IndexError:
                errors.append(f"Missing variant detail: {item['id']} variant {index}")
                continue
            website_price = variant.get("price")
            if website_price is None and approved_price is None:
                continue
            if website_price is None or approved_price is None or int(website_price) != int(approved_price):
                price_mismatches.append({
                    "id": item["id"],
                    "label": variant["label"],
                    "websitePrice": website_price,
                    "approvedPrice": approved_price,
                })
    if price_mismatches:
        errors.append(f"Price comparison failed: {len(price_mismatches)} mismatches.")

    stable_ids = []
    for detail in details["items"].values():
        stable_ids.append(detail["stableProductId"])
        stable_ids.extend(variant["stableId"] for variant in detail["variants"])
    duplicate_stable_ids = sorted({stable_id for stable_id in stable_ids if stable_ids.count(stable_id) > 1})
    if duplicate_stable_ids:
        errors.append(f"Duplicate-product check failed: {len(duplicate_stable_ids)} duplicate stable IDs.")

    missing_images = []
    for item in menu["items"]:
        for key in ["image", "imageThumb"]:
            image = item.get(key)
            if image and not (ROOT / image).exists():
                missing_images.append({"id": item["id"], "field": key, "image": image})
    if missing_images:
        errors.append(f"Broken image-reference check failed: {len(missing_images)} missing images.")

    if report["lowConfidenceMatches"]:
        errors.append("Low-confidence matches exist in menu-import-report.json.")
    if report["unmatchedWebsiteDishes"]:
        errors.append("Unmatched website dishes exist in menu-import-report.json.")
    if report["priceMismatches"]:
        errors.append("Price mismatches exist in menu-import-report.json.")

    result = {
        "productsBefore": menu["meta"]["itemCount"],
        "productsAfter": len(details["items"]),
        "categoriesBefore": menu["meta"]["categoryCount"],
        "categoriesAfter": len(menu["categories"]),
        "websiteVariants": sum(len(item["variants"]) for item in menu["items"]),
        "approvedVariantDetails": details["meta"]["totalPortionDetails"],
        "missingDescriptions": len(item_ids - detail_ids),
        "duplicateStableIds": len(duplicate_stable_ids),
        "brokenImageReferences": len(missing_images),
        "priceMismatches": len(price_mismatches),
        "lowConfidenceMatches": len(report["lowConfidenceMatches"]),
        "unmatchedWebsiteDishes": len(report["unmatchedWebsiteDishes"]),
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
