/**
 * tests/harness.js
 * Lightweight, robust, zero-dependency testing harness for Poster Lab Store E2E test suite.
 * Built for Node.js 18+ (tested on Node 24).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

// Test Suite State
class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = Date.now();
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEachFns: [],
      afterEachFns: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {});
    }
    this.currentSuite.tests.push({
      name,
      fn,
      suiteName: this.currentSuite.name,
      status: 'pending',
      error: null,
      duration: 0
    });
    this.totalTests++;
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEachFns.push(fn);
    }
  }

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEachFns.push(fn);
    }
  }

  async run() {
    this.startTime = Date.now();
    for (const suite of this.suites) {
      for (const t of suite.tests) {
        const start = Date.now();
        try {
          for (const b of suite.beforeEachFns) {
            await b();
          }
          await t.fn();
          for (const a of suite.afterEachFns) {
            await a();
          }
          t.status = 'passed';
          this.passedTests++;
        } catch (err) {
          t.status = 'failed';
          t.error = err;
          this.failedTests++;
        } finally {
          t.duration = Date.now() - start;
        }
      }
    }
    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      duration: Date.now() - this.startTime
    };
  }

  printSummary(title = 'TEST RESULTS') {
    const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(70));
    console.log(`  ${title}`);
    console.log('='.repeat(70));

    for (const suite of this.suites) {
      const suitePassed = suite.tests.every(t => t.status === 'passed');
      const icon = suitePassed ? '✓' : '✖';
      console.log(`\n${icon} Suite: ${suite.name}`);
      for (const t of suite.tests) {
        if (t.status === 'passed') {
          console.log(`    ✓ ${t.name} (${t.duration}ms)`);
        } else {
          console.log(`    ✖ ${t.name} (${t.duration}ms)`);
          if (t.error) {
            console.log(`        Error: ${t.error.message}`);
            if (t.error.expected !== undefined && t.error.actual !== undefined) {
              console.log(`        Expected: ${JSON.stringify(t.error.expected)}`);
              console.log(`        Actual:   ${JSON.stringify(t.error.actual)}`);
            }
          }
        }
      }
    }

    console.log('\n' + '-'.repeat(70));
    console.log(`Total: ${this.totalTests} | Passed: ${this.passedTests} | Failed: ${this.failedTests} | Time: ${durationSec}s`);
    console.log('='.repeat(70) + '\n');
  }
}

// Global active runner
const runner = new TestRunner();

function describe(name, fn) {
  runner.describe(name, fn);
}

function test(name, fn) {
  runner.test(name, fn);
}

const it = test;

function beforeEach(fn) {
  runner.beforeEach(fn);
}

function afterEach(fn) {
  runner.afterEach(fn);
}

// Assertions
class AssertionError extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new AssertionError(message, true, false);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const msg = message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`;
    throw new AssertionError(msg, expected, actual);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    const msg = message || `Expected value not to equal ${JSON.stringify(expected)}`;
    throw new AssertionError(msg, `not ${expected}`, actual);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message || `Deep equality mismatch`;
    throw new AssertionError(msg, expected, actual);
  }
}

function assertMatch(actual, regex, message) {
  if (typeof actual !== 'string' || !regex.test(actual)) {
    const msg = message || `Expected "${actual}" to match regex ${regex}`;
    throw new AssertionError(msg, regex.toString(), actual);
  }
}

function assertIncludes(actual, substringOrItem, message) {
  if (typeof actual === 'string') {
    if (!actual.includes(substringOrItem)) {
      const msg = message || `Expected string to include "${substringOrItem}"`;
      throw new AssertionError(msg, substringOrItem, actual);
    }
  } else if (Array.isArray(actual)) {
    if (!actual.includes(substringOrItem)) {
      const msg = message || `Expected array to include item`;
      throw new AssertionError(msg, substringOrItem, actual);
    }
  } else {
    throw new AssertionError(`Unsupported type for assertIncludes`, substringOrItem, actual);
  }
}

function assertThrows(fn, expectedMessageOrRegex, message) {
  let threw = false;
  let caught = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    caught = err;
  }
  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw an error', 'Error', 'No error thrown');
  }
  if (expectedMessageOrRegex) {
    if (expectedMessageOrRegex instanceof RegExp) {
      if (!expectedMessageOrRegex.test(caught.message)) {
        throw new AssertionError(message || `Error message did not match regex`, expectedMessageOrRegex.toString(), caught.message);
      }
    } else if (typeof expectedMessageOrRegex === 'string') {
      if (!caught.message.includes(expectedMessageOrRegex)) {
        throw new AssertionError(message || `Error message did not include string`, expectedMessageOrRegex, caught.message);
      }
    }
  }
}

// Project File Helpers
function readProjectFile(relPath) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Project file not found: ${relPath} (resolved: ${fullPath})`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function projectFileExists(relPath) {
  return fs.existsSync(path.resolve(ROOT_DIR, relPath));
}

// Lightweight HTML Parser & Inspector
class SimpleHtmlDoc {
  constructor(htmlContent) {
    this.raw = htmlContent;
  }

  hasTag(tagName) {
    const regex = new RegExp(`<${tagName}[\\s>]`, 'i');
    return regex.test(this.raw);
  }

  hasElementWithId(id) {
    const regex = new RegExp(`id=["']${id}["']`, 'i');
    return regex.test(this.raw);
  }

  hasElementWithClass(className) {
    const regex = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, 'i');
    return regex.test(this.raw);
  }

  hasScript(srcSubstring) {
    const regex = new RegExp(`<script[^>]*src=["'][^"']*${srcSubstring}[^"']*["']`, 'i');
    return regex.test(this.raw);
  }

  hasStylesheet(hrefSubstring) {
    const regex = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*${hrefSubstring}[^"']*["']`, 'i');
    return regex.test(this.raw);
  }

  getScripts() {
    const matches = [];
    const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = regex.exec(this.raw)) !== null) {
      const attrs = m[1];
      const inline = m[2];
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      matches.push({
        src: srcMatch ? srcMatch[1] : null,
        isDefer: /defer\b/i.test(attrs),
        isAsync: /async\b/i.test(attrs),
        inline: inline.trim()
      });
    }
    return matches;
  }

  getLinks() {
    const matches = [];
    const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(this.raw)) !== null) {
      const attrs = m[1];
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      matches.push({
        href: hrefMatch ? hrefMatch[1] : null,
        text,
        attrs
      });
    }
    return matches;
  }
}

function parseHtml(relPath) {
  const content = readProjectFile(relPath);
  return new SimpleHtmlDoc(content);
}

// Storage Mock (Emulates browser localStorage with event broadcasting)
class MockStorage {
  constructor() {
    this.store = new Map();
    this.listeners = [];
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    const oldValue = this.getItem(key);
    const strVal = String(value);
    this.store.set(key, strVal);
    this._triggerStorageEvent(key, oldValue, strVal);
  }

  removeItem(key) {
    const oldValue = this.getItem(key);
    this.store.delete(key);
    this._triggerStorageEvent(key, oldValue, null);
  }

  clear() {
    this.store.clear();
    this._triggerStorageEvent(null, null, null);
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }

  _triggerStorageEvent(key, oldValue, newValue) {
    const event = {
      key,
      oldValue,
      newValue,
      url: 'http://localhost/store',
      storageArea: this
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        // ignore listener errors
      }
    }
  }

  addEventListener(type, listener) {
    if (type === 'storage') {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === 'storage') {
      this.listeners = this.listeners.filter(l => l !== listener);
    }
  }
}

// In-Memory Broadcast Channel Mock (for isolated cross-tab simulation)
class MockBroadcastHub {
  constructor() {
    this.channels = new Map();
  }

  createChannel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new Set());
    }
    const hub = this;
    const channelSet = this.channels.get(name);

    class MockBroadcastChannel {
      constructor() {
        this.name = name;
        this.onmessage = null;
        this.listeners = [];
        this.closed = false;
        channelSet.add(this);
      }

      postMessage(data) {
        if (this.closed) throw new Error('BroadcastChannel is closed');
        // Dispatch to all OTHER channels with the same name
        for (const peer of channelSet) {
          if (peer !== this && !peer.closed) {
            const event = { data };
            if (typeof peer.onmessage === 'function') {
              peer.onmessage(event);
            }
            for (const l of peer.listeners) {
              l(event);
            }
          }
        }
      }

      addEventListener(type, listener) {
        if (type === 'message') {
          this.listeners.push(listener);
        }
      }

      removeEventListener(type, listener) {
        if (type === 'message') {
          this.listeners = this.listeners.filter(l => l !== listener);
        }
      }

      close() {
        this.closed = true;
        channelSet.delete(this);
      }
    }

    return new MockBroadcastChannel();
  }
}

// Authoritative Reference Program / Calculation Oracle
// Derived strictly from ORIGINAL_REQUEST.md & PROJECT.md
const AuthoritativePricing = {
  tiers: {
    "20x30": 180,
    "30x40": 200,
    "40x50": 250,
    "50x70": 300
  },
  basePrice: 180,
  deliveryFee: 35,
  frames: ["Black", "White", "Transparent"],
  defaultFrame: "Black",
  frameAdders: {
    Black: 0,
    White: 0,
    Transparent: 0,
    None: 0
  },
  wallBackgroundGradient: "linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)",

  calculateItemPrice(size, frame = "Black") {
    const sizePrice = this.tiers[size];
    if (sizePrice === undefined) {
      throw new Error(`Invalid size: ${size}. Valid sizes are: ${Object.keys(this.tiers).join(', ')}`);
    }
    const frameAdder = this.frameAdders[frame] !== undefined ? this.frameAdders[frame] : 0;
    return sizePrice + frameAdder;
  },

  calculateCartTotal(items, couponDiscountPercentage = 0) {
    let subtotal = 0;
    for (const item of items) {
      const unit = this.calculateItemPrice(item.size, item.frame);
      const qty = item.quantity !== undefined ? item.quantity : 1;
      subtotal += unit * qty;
    }
    const discountAmount = Math.min(subtotal, Math.round(subtotal * (couponDiscountPercentage / 100)));
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const total = discountedSubtotal > 0 ? discountedSubtotal + this.deliveryFee : 0;
    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      deliveryFee: this.deliveryFee,
      total
    };
  }
};

module.exports = {
  runner,
  describe,
  test,
  it,
  beforeEach,
  afterEach,
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertMatch,
  assertIncludes,
  assertThrows,
  readProjectFile,
  projectFileExists,
  parseHtml,
  SimpleHtmlDoc,
  MockStorage,
  MockBroadcastHub,
  AuthoritativePricing,
  ROOT_DIR
};
