import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOrbGeometry,
  computeEyeLookOffset,
  getNextScriptTurn,
  DEFAULT_CHAT_SCRIPT,
} from './orbPhysics.ts';

test('computeOrbGeometry matches exact Planes 64px and 36px orb ratios', () => {
  const geo64 = computeOrbGeometry(64);
  assert.equal(geo64.size, 64);
  assert.equal(geo64.eyeSize, 10.88);
  assert.equal(geo64.leftEyeLeft, 17.28);
  assert.equal(geo64.rightEyeLeft, 35.84);
  assert.equal(geo64.eyeTop, 23.04);

  const geo36 = computeOrbGeometry(36);
  assert.equal(geo36.size, 36);
  assert.equal(geo36.eyeSize, 6.12);
  assert.equal(geo36.leftEyeLeft, 9.72);
  assert.equal(geo36.rightEyeLeft, 20.16);
  assert.equal(geo36.eyeTop, 12.96);
});

test('computeEyeLookOffset returns zero offset when pointer is at center', () => {
  const offset = computeEyeLookOffset({
    pointerX: 200,
    pointerY: 200,
    orbCenterX: 200,
    orbCenterY: 200,
    orbSize: 64,
  });
  assert.equal(offset.x, 0);
  assert.equal(offset.y, 0);
  assert.equal(offset.distanceRatio, 0);
});

test('computeEyeLookOffset clamps eye travel within maxTravelRatio bounds', () => {
  const offset = computeEyeLookOffset({
    pointerX: 1200,
    pointerY: 200,
    orbCenterX: 200,
    orbCenterY: 200,
    orbSize: 64,
    maxTravelRatio: 0.11,
  });
  assert.equal(offset.distanceRatio, 1);
  assert.equal(offset.x, 7.04);
  assert.equal(offset.y, 0);
});

test('getNextScriptTurn cycles through script turns deterministically', () => {
  const turn0 = getNextScriptTurn(DEFAULT_CHAT_SCRIPT, 0);
  const turn1 = getNextScriptTurn(DEFAULT_CHAT_SCRIPT, 1);
  const turn3 = getNextScriptTurn(DEFAULT_CHAT_SCRIPT, 3);
  assert.equal(turn0.prompt, DEFAULT_CHAT_SCRIPT[0].prompt);
  assert.equal(turn1.prompt, DEFAULT_CHAT_SCRIPT[1].prompt);
  assert.equal(turn3.prompt, DEFAULT_CHAT_SCRIPT[0].prompt);
});
