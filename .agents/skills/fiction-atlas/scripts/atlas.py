"""Fiction Atlas: dependency-free creator and validator."""
import argparse
import json
import math
from pathlib import Path
import re

STATES = {"established", "proposal", "unknown"}
KINDS = {"town", "village", "tower", "site", "junction", "bridge"}
TERRAIN = {"forest", "mountain", "plain", "water", "river", "land"}


def validate(data):
    def check(ok, message):
        if not ok:
            raise ValueError(message)

    def number(x):
        return type(x) in (int, float) and math.isfinite(x)

    def string(x):
        return isinstance(x, str)

    def level(item):
        check(type(item.get("level")) is int and 0 <= item["level"] <= 5,
              f"{item['id']}: level must be 0..5")

    def evidence(item):
        check(item.get("status") in STATES, f"{item['id']}: invalid status")
        check(string(item.get("note")), f"{item['id']}: note required")
        check(isinstance(item.get("sources"), list), f"{item['id']}: sources required")
        for source in item["sources"]:
            check(isinstance(source, dict) and string(source.get("ref"))
                  and string(source.get("detail")), f"{item['id']}: invalid source")

    check(isinstance(data, dict) and data.get("version") == 1, "version must be 1")
    for field in ("title", "subtitle", "notice"):
        check(string(data.get(field)), f"{field} required")
    check(type(data.get("north")) is bool, "north must be boolean")
    lookup = {}
    for field in ("maps", "places", "routes", "terrain"):
        check(isinstance(data.get(field), list), f"{field} must be an array")
        lookup[field] = {}
        for item in data[field]:
            check(isinstance(item, dict), f"{field}: object required")
            ident = item.get("id", "")
            check(isinstance(ident, str) and re.fullmatch(r"[a-z][a-z0-9-]*", ident),
                  f"{field}: invalid id")
            check(ident not in lookup[field], f"{field}: duplicate id {ident}")
            check(string(item.get("name")) and item["name"].strip(), f"{ident}: name required")
            lookup[field][ident] = item
    maps = lookup["maps"]
    check(data.get("defaultMap") in maps, "defaultMap does not exist")
    for item in data["maps"]:
        bounds = item.get("bounds")
        check(isinstance(bounds, list) and len(bounds) == 4 and all(map(number, bounds))
              and bounds[2] > 0 and bounds[3] > 0, f"{item['id']}: invalid bounds")
        level(item)
        check(string(item.get("note")), f"{item['id']}: note required")
    for item in data["maps"]:
        visited = {item["id"]}
        current = item
        while current.get("parent") is not None:
            parent_id = current["parent"]
            check(parent_id in maps, f"{current['id']}: parent does not exist")
            check(parent_id not in visited, "map hierarchy contains a cycle")
            visited.add(parent_id)
            parent = maps[parent_id]
            x, y, w, h = current["bounds"]
            px, py, pw, ph = parent["bounds"]
            check(px <= x and py <= y and x+w <= px+pw and y+h <= py+ph,
                  f"{current['id']}: bounds outside parent")
            current = parent
    places = lookup["places"]
    for item in data["places"]:
        check(item.get("kind") in KINDS, f"{item['id']}: invalid kind")
        check(number(item.get("x")) and number(item.get("y")), f"{item['id']}: invalid coordinates")
        check(any(m["bounds"][0] <= item["x"] <= m["bounds"][0]+m["bounds"][2]
                  and m["bounds"][1] <= item["y"] <= m["bounds"][1]+m["bounds"][3]
                  for m in data["maps"] if m.get("parent") is None),
              f"{item['id']}: outside world bounds")
        check(item.get("placement") in STATES, f"{item['id']}: invalid placement")
        offset = item.get("labelOffset", [12, -12])
        check(isinstance(offset, list) and len(offset) == 2 and all(map(number, offset)),
              f"{item['id']}: invalid labelOffset")
        check(item.get("labelAnchor", "start") in {"start", "middle", "end"},
              f"{item['id']}: invalid labelAnchor")
        level(item)
        evidence(item)
        check(any(m["level"] >= item["level"] and m["bounds"][0] <= item["x"] <= m["bounds"][0]+m["bounds"][2]
                  and m["bounds"][1] <= item["y"] <= m["bounds"][1]+m["bounds"][3]
                  for m in data["maps"]), f"{item['id']}: no map can display this place")
    for item in data["routes"]:
        level(item)
        evidence(item)
        stops = item.get("stops")
        check(isinstance(stops, list) and len(stops) >= 2, f"{item['id']}: two stops required")
        for stop in stops:
            check(isinstance(stop, str) and stop in places, f"{item['id']}: missing stop {stop}")
            check(places[stop]["level"] <= item["level"], f"{item['id']}: hidden endpoint {stop}")
    for item in data["terrain"]:
        check(item.get("kind") in TERRAIN, f"{item['id']}: invalid terrain kind")
        points = item.get("points")
        check(isinstance(points, list) and len(points) >= (2 if item["kind"] == "river" else 3),
              f"{item['id']}: insufficient points")
        check(all(isinstance(p, list) and len(p) == 2 and all(map(number, p)) for p in points),
              f"{item['id']}: invalid points")
        evidence(item)
        if "level" in item:
            level(item)
    return data


def build(data, output):
    validate(data)
    template = (Path(__file__).resolve().parents[1] / "assets" / "atlas.html").read_text(encoding="utf-8")
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template.replace("__ATLAS_DATA__", payload), encoding="utf-8")


def sample(title):
    return {"version": 1, "title": title, "subtitle": "創作のための地図帳", "north": False,
            "notice": "すべて制作案。位置と縮尺は未確定です。", "defaultMap": "region",
            "maps": [
                {"id": "world", "name": "世界図", "parent": None, "bounds": [-400, -300, 1800, 1200], "level": 0, "note": "余白は未設定の世界。"},
                {"id": "region", "name": "地方図", "parent": "world", "bounds": [0, 0, 1000, 650], "level": 2, "note": "ここから世界を作る。"}],
            "places": [{"id": "first-town", "name": "はじまりの町", "kind": "town", "x": 500, "y": 325,
                        "level": 0, "status": "proposal", "placement": "proposal", "note": "名前と役割を決める。", "sources": []}],
            "routes": [], "terrain": []}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest="command", required=True)
    for name in ("init", "validate", "build"):
        cmd = subs.add_parser(name)
        cmd.add_argument("file", type=Path)
        if name == "init":
            cmd.add_argument("--title", default="新しい世界")
        if name == "build":
            cmd.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "init":
            # Exclusive creation avoids overwriting a writer's world.
            args.file.parent.mkdir(parents=True, exist_ok=True)
            with args.file.open("x", encoding="utf-8") as stream:
                json.dump(sample(args.title), stream, ensure_ascii=False, indent=2)
                stream.write("\n")
        else:
            data = validate(json.loads(args.file.read_text(encoding="utf-8-sig")))
            if args.command == "build":
                if args.file.resolve() == args.out.resolve():
                    raise ValueError("output must not overwrite source JSON")
                build(data, args.out)
            print(f"OK: {len(data['maps'])} maps, {len(data['places'])} places, {len(data['routes'])} routes")
    except (ValueError, OSError, TypeError) as error:
        parser.exit(1, f"Error: {error}\n")


if __name__ == "__main__":
    main()
