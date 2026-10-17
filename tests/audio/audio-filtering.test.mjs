import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Butterworth 2nd-order highpass filter magnitude response:
 * |H(f)|^2 = (f / fc)^4 / (1 + (f / fc)^4)
 * Attenuation in dB: 10 * log10(|H(f)|^2)
 */
function calculateHighPassGainDb(frequencyHz, cutoffHz) {
  const ratio = frequencyHz / cutoffHz;
  const ratio4 = Math.pow(ratio, 4);
  const powerGain = ratio4 / (1 + ratio4);
  return 10 * Math.log10(powerGain);
}

function clampCutoff(requestedCutoff) {
  const cutoff = requestedCutoff ?? 100;
  return Math.min(120, Math.max(80, cutoff));
}

describe("Web Audio API High-Pass Filtering (80Hz - 120Hz Cutoff)", () => {
  it("defaults to 100Hz cutoff when not specified", () => {
    const cutoff = clampCutoff(undefined);
    assert.strictEqual(cutoff, 100);
  });

  it("clamps sub-80Hz cutoff requests to minimum 80Hz bound", () => {
    assert.strictEqual(clampCutoff(40), 80);
    assert.strictEqual(clampCutoff(79), 80);
    assert.strictEqual(clampCutoff(0), 80);
  });

  it("clamps ultra-120Hz cutoff requests to maximum 120Hz bound", () => {
    assert.strictEqual(clampCutoff(150), 120);
    assert.strictEqual(clampCutoff(200), 120);
  });

  it("preserves custom cutoffs within the valid 80Hz - 120Hz band", () => {
    assert.strictEqual(clampCutoff(80), 80);
    assert.strictEqual(clampCutoff(90), 90);
    assert.strictEqual(clampCutoff(110), 110);
    assert.strictEqual(clampCutoff(120), 120);
  });

  it("Butterworth Q-factor approximates 1/sqrt(2) for maximally flat passband", () => {
    const butterworthQ = 1 / Math.SQRT2;
    const configuredQ = 0.7071;
    assert.ok(Math.abs(butterworthQ - configuredQ) < 0.001);
  });

  it("attenuates low-frequency HVAC rumble and fan hum (20Hz - 60Hz)", () => {
    const cutoff = 100;
    // 25Hz mechanical building/HVAC rumble: should be attenuated by > 20 dB
    const gain25Hz = calculateHighPassGainDb(25, cutoff);
    assert.ok(gain25Hz < -20, `Expected gain at 25Hz < -20dB, got ${gain25Hz.toFixed(1)}dB`);

    // 50Hz/60Hz fan motor and electrical hum: should be attenuated by > 8 dB
    const gain50Hz = calculateHighPassGainDb(50, cutoff);
    assert.ok(gain50Hz < -10, `Expected gain at 50Hz < -10dB, got ${gain50Hz.toFixed(1)}dB`);

    const gain60Hz = calculateHighPassGainDb(60, cutoff);
    assert.ok(gain60Hz < -8, `Expected gain at 60Hz < -8dB, got ${gain60Hz.toFixed(1)}dB`);

    // 100Hz cutoff point should be at the standard -3dB half-power point
    const gain100Hz = calculateHighPassGainDb(100, cutoff);
    assert.ok(Math.abs(gain100Hz - (-3.01)) < 0.1, `Expected cutoff gain ~ -3dB, got ${gain100Hz.toFixed(2)}dB`);
  });

  it("preserves speech formants and clinical dialogue (200Hz - 3400Hz)", () => {
    const cutoff = 100;
    // 200Hz low voice fundamental: should have less than 0.5 dB attenuation
    const gain200Hz = calculateHighPassGainDb(200, cutoff);
    assert.ok(gain200Hz > -0.5, `Expected gain at 200Hz > -0.5dB, got ${gain200Hz.toFixed(2)}dB`);

    // 500Hz first formant: should have virtually 0 dB attenuation
    const gain500Hz = calculateHighPassGainDb(500, cutoff);
    assert.ok(gain500Hz > -0.05, `Expected gain at 500Hz > -0.05dB, got ${gain500Hz.toFixed(3)}dB`);

    // 1000Hz speech clarity: 100% transparent passband
    const gain1000Hz = calculateHighPassGainDb(1000, cutoff);
    assert.ok(gain1000Hz > -0.001, `Expected gain at 1000Hz ~ 0dB, got ${gain1000Hz.toFixed(4)}dB`);
  });

  it("validates audio graph node connectivity and lifecycle cleanup", () => {
    // Mock AudioContext and nodes to verify audio graph routing
    const connections = [];
    const disconnections = [];

    class MockNode {
      constructor(name) {
        this.nodeName = name;
      }
      connect(target) {
        connections.push(`${this.nodeName} -> ${target.nodeName}`);
        return target;
      }
      disconnect() {
        disconnections.push(this.nodeName);
      }
    }

    class MockBiquadFilter extends MockNode {
      constructor() {
        super("highpass_filter");
        this.type = "highpass";
        this.frequency = { setValueAtTime: (v) => { this.freqValue = v; } };
        this.Q = { setValueAtTime: (v) => { this.qValue = v; } };
      }
    }

    const source = new MockNode("source");
    const filter = new MockBiquadFilter();
    const analyser = new MockNode("analyser");
    const destination = new MockNode("destination");

    // Connect audio graph
    filter.frequency.setValueAtTime(100, 0);
    filter.Q.setValueAtTime(0.7071, 0);

    source.connect(filter);
    filter.connect(analyser);
    filter.connect(destination);

    assert.deepStrictEqual(connections, [
      "source -> highpass_filter",
      "highpass_filter -> analyser",
      "highpass_filter -> destination",
    ]);
    assert.strictEqual(filter.freqValue, 100);
    assert.strictEqual(filter.qValue, 0.7071);

    // Teardown
    source.disconnect();
    filter.disconnect();
    analyser.disconnect();
    destination.disconnect();

    assert.deepStrictEqual(disconnections, [
      "source",
      "highpass_filter",
      "analyser",
      "destination",
    ]);
  });
});
