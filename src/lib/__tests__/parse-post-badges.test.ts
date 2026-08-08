jest.mock("@/lib/supabase", () => ({
  supabase: {},
}));

import { parsePostBadges } from "../posts";

const validBadge = {
  badge_id: "badge-1",
  badge_name: "First Post",
  description: "Awarded for your first post",
  award_number: 1,
  total_awarded: 42,
  awarded_at: "2026-01-01T00:00:00Z",
};

describe("parsePostBadges", () => {
  it("parses a valid badges array", () => {
    expect(parsePostBadges([validBadge])).toEqual([validBadge]);
  });

  it("returns an empty array for an empty array", () => {
    expect(parsePostBadges([])).toEqual([]);
  });

  it("returns an empty array for non-arrays", () => {
    expect(parsePostBadges(null)).toEqual([]);
    expect(parsePostBadges(undefined)).toEqual([]);
    expect(parsePostBadges({})).toEqual([]);
    expect(parsePostBadges("badges")).toEqual([]);
  });

  it("skips partial objects missing required string fields", () => {
    expect(
      parsePostBadges([
        { badge_id: "x" },
        { badge_id: "x", badge_name: "Name" },
        {
          badge_id: "",
          badge_name: "Name",
          description: "Desc",
        },
        {
          badge_id: "ok",
          badge_name: "Name",
          description: "Desc",
        },
        null,
        "nope",
      ]),
    ).toEqual([
      {
        badge_id: "ok",
        badge_name: "Name",
        description: "Desc",
        award_number: 0,
        total_awarded: 0,
        awarded_at: "",
      },
    ]);
  });

  it("coerces missing numeric fields and awarded_at", () => {
    expect(
      parsePostBadges([
        {
          badge_id: "b",
          badge_name: "Name",
          description: "Desc",
          award_number: "1",
          total_awarded: null,
        },
      ]),
    ).toEqual([
      {
        badge_id: "b",
        badge_name: "Name",
        description: "Desc",
        award_number: 0,
        total_awarded: 0,
        awarded_at: "",
      },
    ]);
  });
});
