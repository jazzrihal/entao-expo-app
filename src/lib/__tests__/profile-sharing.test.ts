import {
  buildProfileLink,
  buildProfileShareMessage,
  profileShareName,
} from "../profile-sharing";
import { POST_LINK_ORIGIN } from "../post-sharing";

describe("profile sharing", () => {
  it("builds a canonical HTTPS link and encodes the username", () => {
    expect(buildProfileLink("alice.smith")).toBe(
      `${POST_LINK_ORIGIN}/user/alice.smith`,
    );
  });

  it("builds the fixed share message without profile content", () => {
    expect(buildProfileShareMessage("Alice")).toBe(
      "See Alice’s profile on Então.",
    );
  });

  it("prefers display name, then username, then Profile", () => {
    expect(profileShareName("Alice", "alice")).toBe("Alice");
    expect(profileShareName("", "alice")).toBe("alice");
    expect(profileShareName(undefined, undefined)).toBe("Profile");
  });
});
