import { describe, it, expect } from "vitest";
import { canAccessVideo } from "./video-access";

const adult = { userId: "owner-1", validated: true, user: { dateOfBirth: new Date("1990-01-01") } };
const minor17 = { userId: "owner-2", validated: true, user: { dateOfBirth: new Date("2009-01-01") } };
const unvalidated = { userId: "owner-3", validated: false, user: { dateOfBirth: new Date("1990-01-01") } };

describe("canAccessVideo", () => {
  it("always lets the owner access their own video, validated or not", () => {
    expect(canAccessVideo({ video: unvalidated, viewerId: "owner-3", viewerRole: null })).toBe(true);
  });

  it("always lets admins access any video", () => {
    expect(canAccessVideo({ video: unvalidated, viewerId: "someone-else", viewerRole: "admin" })).toBe(true);
  });

  it("blocks a non-owner, non-admin viewer from an unvalidated video", () => {
    expect(canAccessVideo({ video: unvalidated, viewerId: "stranger", viewerRole: null })).toBe(false);
  });

  it("lets any viewer see a validated adult's video", () => {
    expect(canAccessVideo({ video: adult, viewerId: "stranger", viewerRole: null })).toBe(true);
  });

  it("blocks a non-recruiter from a validated minor's (16-17) video", () => {
    expect(canAccessVideo({ video: minor17, viewerId: "stranger", viewerRole: null })).toBe(false);
  });

  it("lets a recruiter see a validated minor's video, matching the feed's age-gate rule", () => {
    expect(canAccessVideo({ video: minor17, viewerId: "recruiter-1", viewerRole: "recruiter" })).toBe(true);
  });
});
