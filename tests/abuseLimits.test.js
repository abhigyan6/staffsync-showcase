import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import express from "express";
import request from "supertest";
import {
  passwordAttemptLimit,
  avatarUploadLimit,
  accountConcurrencyLimit,
} from "../server/middleware/abuseLimits.js";

for (const [name, limiter] of [
  ["password attempts", passwordAttemptLimit],
  ["photo uploads", avatarUploadLimit],
]) {
  test(`${name} exhaust only the caller's quota and return retry guidance`, async () => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { _id: req.get("test-account") };
      next();
    });
    app.post("/operation", limiter, (req, res) => res.sendStatus(400));
    for (let i = 0; i < 10; i++) {
      assert.equal(
        (await request(app).post("/operation").set("test-account", "first"))
          .status,
        400,
      );
    }
    const blocked = await request(app)
      .post("/operation")
      .set("test-account", "first");
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers["retry-after"]) > 0);
    assert.ok(blocked.body.message);
    assert.equal(
      (await request(app).post("/operation").set("test-account", "second"))
        .status,
      400,
    );
  });
}

test("concurrent operations are scoped per account and release once on completion or disconnect", () => {
  const limit = accountConcurrencyLimit(2, "Try again shortly.");
  const enter = (account) => {
    const res = new EventEmitter();
    res.set = () => res;
    res.status = (status) => {
      res.statusCode = status;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    let accepted = false;
    limit({ user: { _id: account } }, res, () => {
      accepted = true;
    });
    return { res, accepted };
  };
  const first = enter("a");
  const second = enter("a");
  assert.ok(first.accepted && second.accepted);
  assert.equal(enter("a").res.statusCode, 429);
  assert.ok(enter("b").accepted);
  first.res.emit("finish");
  first.res.emit("close");
  const replacement = enter("a");
  assert.ok(replacement.accepted);
  assert.equal(enter("a").res.statusCode, 429);
  second.res.emit("close");
  assert.ok(enter("a").accepted);
  assert.equal(first.res.listenerCount("close"), 0);
});
