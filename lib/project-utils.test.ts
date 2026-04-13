import { describe, expect, it } from "vitest";
import {
  applyTemplate,
  cloneProject,
  createEmptyProject,
  duplicateAssemblyGroup,
  normalizeProjectJsonInput,
  parseProject,
  parseProjectLibrary,
  parseTemplates,
  serializeTemplate,
} from "./project-utils";
import type { Project } from "./project-types";

describe("parseProject", () => {
  it("defaults connections to [] when missing (legacy saves)", () => {
    const legacy = JSON.stringify({
      version: 1,
      name: "Legacy",
      millingAllowanceInches: 0.5,
      maxTransportLengthInches: 96,
      wasteFactorPercent: 15,
      parts: [],
      joints: [],
    });
    const p = parseProject(legacy);
    expect(p).not.toBeNull();
    expect(p!.connections).toEqual([]);
    expect(p!.checkpoints).toEqual({
      materialAssumptionsReviewed: false,
      joineryReviewed: false,
    });
    expect(p!.costRatesByGroup).toEqual({});
  });

  it("preserves connections array when present", () => {
    const withConn = {
      ...createEmptyProject(),
      connections: [
        {
          id: "c1",
          partAId: "a",
          partBId: "b",
          ruleId: "dado_shelf_width",
          params: { dadoDepth: 0.25 },
        },
      ],
    };
    const p = parseProject(JSON.stringify(withConn));
    expect(p?.connections).toHaveLength(1);
    expect(p?.connections[0]?.id).toBe("c1");
  });

  it("preserves costRatesByGroup when present", () => {
    const withRates = {
      ...createEmptyProject(),
      costRatesByGroup: {
        "White oak||4/4": { perBoardFoot: 14.5, perLinearFoot: 0.25 },
      },
    };
    const p = parseProject(JSON.stringify(withRates));
    expect(p?.costRatesByGroup["White oak||4/4"]?.perBoardFoot).toBe(14.5);
    expect(p?.costRatesByGroup["White oak||4/4"]?.perLinearFoot).toBe(0.25);
  });

  it("assigns a project id for legacy projects missing id", () => {
    const legacy = {
      version: 1,
      name: "Legacy",
      millingAllowanceInches: 0.5,
      maxTransportLengthInches: 96,
      wasteFactorPercent: 15,
      parts: [],
      joints: [],
      connections: [],
      costRatesByGroup: {},
      checkpoints: {
        materialAssumptionsReviewed: false,
        joineryReviewed: false,
      },
      workshop: {
        lumberProfile: "s4s_hardwood",
        offcutMode: "none",
      },
    };
    const p = parseProject(JSON.stringify(legacy));
    expect(typeof p?.id).toBe("string");
    expect((p?.id.length ?? 0) > 0).toBe(true);
  });
});

describe("project clone/template/assembly duplication", () => {
  function makeProject(): Project {
    return {
      ...createEmptyProject(),
      name: "Source",
      parts: [
        {
          id: "p1",
          name: "Side",
          assembly: "Case",
          quantity: 2,
          finished: { t: 0.75, w: 16, l: 30 },
          rough: { t: 1, w: 16.5, l: 30.5, manual: false },
          material: { label: "Hardwood", thicknessCategory: "4/4" },
          grainNote: "",
          status: "solid",
        },
        {
          id: "p2",
          name: "Stretch",
          assembly: "Case",
          quantity: 2,
          finished: { t: 0.75, w: 3, l: 20 },
          rough: { t: 1, w: 3.5, l: 20.5, manual: false },
          material: { label: "Hardwood", thicknessCategory: "4/4" },
          grainNote: "",
          status: "solid",
        },
      ],
      joints: [
        {
          id: "j1",
          ruleId: "dado_shelf_width",
          primaryPartId: "p1",
          matePartId: "p2",
          params: { dadoDepth: 0.25 },
          explanation: "test",
          finishedBefore: { t: 0.75, w: 16, l: 30 },
          finishedAfter: { t: 0.75, w: 15.5, l: 30 },
        },
      ],
      connections: [
        {
          id: "c1",
          partAId: "p1",
          partBId: "p2",
          ruleId: "dado_shelf_width",
          params: { dadoDepth: 0.25 },
          jointId: "j1",
        },
      ],
    };
  }

  it("clones project with new ids and intact references", () => {
    const source = makeProject();
    const cloned = cloneProject(source, "Clone");
    expect(cloned.name).toBe("Clone");
    expect(cloned.id).not.toBe(source.id);
    expect(cloned.parts).toHaveLength(source.parts.length);
    expect(cloned.parts.some((part) => part.id === "p1")).toBe(false);
    expect(cloned.connections[0]?.jointId).toBe(cloned.joints[0]?.id);
  });

  it("applies template to produce a fresh project graph", () => {
    const source = makeProject();
    const template = serializeTemplate(source, "Starter");
    const applied = applyTemplate(template, "From Template");
    expect(applied.name).toBe("From Template");
    expect(applied.id).not.toBe(source.id);
    expect(applied.parts).toHaveLength(2);
    expect(applied.parts.some((part) => part.id === "p1")).toBe(false);
    expect(applied.connections[0]?.jointId).toBe(applied.joints[0]?.id);
  });

  it("duplicates selected assembly parts and provenance", () => {
    const source = makeProject();
    const duplicated = duplicateAssemblyGroup(source, "Case");
    expect(duplicated.parts).toHaveLength(4);
    expect(duplicated.joints).toHaveLength(2);
    expect(duplicated.connections).toHaveLength(2);
    expect(duplicated.parts.filter((part) => part.name.endsWith("(copy)"))).toHaveLength(2);
  });
});

describe("normalizeProjectJsonInput", () => {
  it("trims whitespace", () => {
    expect(normalizeProjectJsonInput("  {\"a\":1}  ")).toBe("{\"a\":1}");
  });

  it("strips UTF-8 BOM", () => {
    expect(normalizeProjectJsonInput("\uFEFF{\"x\":1}")).toBe("{\"x\":1}");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeProjectJsonInput("   \n\t  ")).toBe("");
  });
});

describe("parseTemplates", () => {
  it("returns [] for invalid JSON", () => {
    expect(parseTemplates("{")).toEqual([]);
  });

  it("returns [] for non-array root", () => {
    expect(parseTemplates(JSON.stringify({ templates: [] }))).toEqual([]);
  });

  it("skips rows missing required string fields", () => {
    const bad = JSON.stringify([{ id: "t1", name: "Only name" }]);
    expect(parseTemplates(bad)).toEqual([]);
  });

  it("parses a valid template row", () => {
    const source = createEmptyProject();
    source.name = "Src";
    const tpl = serializeTemplate(source, "My template");
    const parsed = parseTemplates(JSON.stringify([tpl]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe("My template");
    expect(parsed[0]?.parts).toEqual([]);
  });

  it("dedupes duplicate template ids (first wins)", () => {
    const source = createEmptyProject();
    const a = serializeTemplate(source, "A");
    const b = { ...serializeTemplate(source, "B"), id: a.id };
    const parsed = parseTemplates(JSON.stringify([a, b]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe("A");
  });

  it("skips rows whose embedded project graph fails parseProject", () => {
    const row = {
      id: "bad",
      version: 1,
      name: "Bad",
      sourceProjectName: "X",
      createdAt: "2020-01-01T00:00:00.000Z",
      millingAllowanceInches: 0.5,
      maxTransportLengthInches: 96,
      wasteFactorPercent: 15,
      costRatesByGroup: {},
      workshop: { lumberProfile: "s4s_hardwood", offcutMode: "none" },
      parts: "not-an-array",
      joints: [],
      connections: [],
    };
    expect(parseTemplates(JSON.stringify([row]))).toEqual([]);
  });
});

describe("parseProjectLibrary", () => {
  it("returns [] for invalid JSON", () => {
    expect(parseProjectLibrary("not json")).toEqual([]);
  });

  it("defaults archived to false when omitted", () => {
    const p = createEmptyProject();
    const raw = JSON.stringify([
      {
        id: "bk1",
        name: "Backup",
        updatedAt: "2024-06-01T12:00:00.000Z",
        project: p,
      },
    ]);
    const rows = parseProjectLibrary(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.archived).toBe(false);
  });

  it("dedupes duplicate record ids (first wins)", () => {
    const p = createEmptyProject();
    const raw = JSON.stringify([
      {
        id: "dup",
        name: "First",
        updatedAt: "2024-01-01T00:00:00.000Z",
        archived: false,
        project: p,
      },
      {
        id: "dup",
        name: "Second",
        updatedAt: "2024-02-01T00:00:00.000Z",
        archived: true,
        project: p,
      },
    ]);
    const rows = parseProjectLibrary(raw);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("First");
  });

  it("skips entries with unparseable nested project", () => {
    const raw = JSON.stringify([
      {
        id: "x",
        name: "Nope",
        updatedAt: "2024-01-01T00:00:00.000Z",
        archived: false,
        project: { version: 2, parts: [] },
      },
    ]);
    expect(parseProjectLibrary(raw)).toEqual([]);
  });
});

describe("parseProject BOM handling", () => {
  it("accepts leading BOM in saved JSON", () => {
    const p = createEmptyProject();
    const withBom = `\uFEFF${JSON.stringify(p)}`;
    const out = parseProject(withBom);
    expect(out).not.toBeNull();
    expect(out?.name).toBe(p.name);
  });
});
