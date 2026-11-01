import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

export async function rpgBackground(base, kind, name) {
  const root = base instanceof URL ? base : pathToFileURL(`${base.replaceAll("\\", "/")}/`);
  const config = await readFile(new URL("config/rpg-backgrounds.json", root), "utf8").catch(
    (error) => {
      if (error.code === "ENOENT") return "[]";
      throw error;
    },
  );
  for (const sheet of JSON.parse(config)) {
    const index = sheet.cells.findIndex((cell) => cell[kind]?.includes(name));
    if (index < 0) continue;
    const raw = await readFile(new URL(sheet.source, root));
    const { width, height } = await sharp(raw).metadata();
    if (width % sheet.columns || height % sheet.rows)
      throw Error(`RPG background grid has partial cells: ${sheet.source}`);
    const image = await sharp(raw)
      .extract({
        left: ((index % sheet.columns) * width) / sheet.columns,
        top: (Math.floor(index / sheet.columns) * height) / sheet.rows,
        width: width / sheet.columns,
        height: height / sheet.rows,
      })
      .png()
      .toBuffer();
    return {
      raw: Buffer.concat([
        Buffer.from(
          JSON.stringify({ source: sheet.source, index, columns: sheet.columns, rows: sheet.rows }),
        ),
        raw,
      ]),
      image,
      source: sheet.source,
    };
  }
  return null;
}
