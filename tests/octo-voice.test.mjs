import assert from "node:assert/strict";
import test from "node:test";
import { selectOctoVoice } from "../lib/octo-voice.mjs";

test("selects a local English voice even when the default English voice is remote", () => {
  const remote = { lang: "en-GB", localService: false, default: true };
  const local = { lang: "en-US", localService: true, default: false };
  assert.equal(selectOctoVoice([remote, local]), local);
});

test("does not fall back to a remote voice or another language", () => {
  assert.equal(selectOctoVoice([
    { lang: "en-GB", localService: false },
    { lang: "nl-NL", localService: true },
  ]), null);
  assert.equal(selectOctoVoice([]), null);
});

test("accepts English locale variants without matching unrelated languages", () => {
  const local = { lang: "EN_au", localService: true };
  assert.equal(selectOctoVoice([{ lang: "eng", localService: true }, local]), local);
});
