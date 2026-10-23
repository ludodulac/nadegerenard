import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizePage } from "../src/worker.js";

test("les textes sont alignés à gauche par défaut, y compris les pages anciennes", () => {
  const page = normalizePage({
    title: "NADÈGE RENARD",
    subtitle: "scénographe/peintre",
    cover: "",
    blocks: [
      { type: "heading", text: "MA VISION" },
      { type: "text", text: "Un parcours" },
    ],
  });
  assert.equal(page.titleAlign, "left");
  assert.equal(page.subtitleAlign, "left");
  assert.equal(page.blocks[0].align, "left");
  assert.equal(page.blocks[1].align, "left");
});

test("Nadège peut placer chaque titre et texte à gauche indépendamment", () => {
  const page = normalizePage({
    title: "BIO", titleAlign: "left", subtitleAlign: "center",
    blocks: [
      { type: "heading", text: "Titre", align: "center" },
      { type: "text", text: "Paragraphe", align: "left" },
    ],
  });
  assert.equal(page.titleAlign, "left");
  assert.equal(page.subtitleAlign, "center");
  assert.equal(page.blocks[0].align, "center");
  assert.equal(page.blocks[1].align, "left");
});

test("les valeurs inattendues d'alignement ne sont pas publiées", () => {
  const page = normalizePage({
    title: "PRESSE", titleAlign: "justify", subtitleAlign: "right",
    blocks: [{ type: "label", text: "Presse", align: "<script>" }],
  });
  assert.equal(page.titleAlign, "left");
  assert.equal(page.subtitleAlign, "left");
  assert.equal(page.blocks[0].align, "left");
});

test("le site ne montre plus les faux libellés Photo d'accueil / Photographie à venir", () => {
  const site = readFileSync(new URL("../public/site.js", import.meta.url), "utf8");
  assert.ok(!site.includes("Photo d'accueil"));
  assert.ok(!site.includes("Photographie à venir"));
  assert.ok(!site.includes("figcaption"));
});
