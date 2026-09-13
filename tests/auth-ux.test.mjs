import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getAuthErrorMessage,
  isAuthConnectivityError,
} from "../src/lib/auth-errors.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("auth page provides public escape routes and an inline error region", async () => {
  const authPage = await read("src/pages/Auth.tsx");

  assert.match(authPage, /Back to home/);
  assert.match(authPage, /Explore funding without an account/);
  assert.match(authPage, /role="alert"/);
  assert.match(authPage, /Forgot password\?/);
  assert.match(authPage, /signInWithOAuth/);
  assert.match(authPage, /provider: "google"/);
});

test("password recovery has request and update flows with app-safe redirects", async () => {
  const [forgotPage, resetPage, app] = await Promise.all([
    read("src/pages/ForgotPassword.tsx"),
    read("src/pages/ResetPassword.tsx"),
    read("src/App.tsx"),
  ]);

  assert.match(forgotPage, /resetPasswordForEmail/);
  assert.match(forgotPage, /appUrl\("reset-password"\)/);
  assert.match(resetPage, /updateUser\(\{ password \}\)/);
  assert.match(resetPage, /PASSWORD_RECOVERY/);
  assert.match(app, /path="\/forgot-password"/);
  assert.match(app, /path="\/reset-password"/);
});

test("auth failures are translated into actionable messages", () => {
  assert.equal(isAuthConnectivityError(new TypeError("Failed to fetch")), true);
  assert.match(
    getAuthErrorMessage(new TypeError("Failed to fetch")),
    /couldn't reach the sign-in service/i,
  );
  assert.match(
    getAuthErrorMessage(new Error("Invalid login credentials")),
    /doesn't match an account/i,
  );
});

test("protected-route handoff preserves query strings and hashes", async () => {
  const protectedRoute = await read("src/components/ProtectedRoute.tsx");

  assert.match(protectedRoute, /location\.pathname/);
  assert.match(protectedRoute, /location\.search/);
  assert.match(protectedRoute, /location\.hash/);
});
