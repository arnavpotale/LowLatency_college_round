import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = require('jiti')(__dirname);

const { MOCK_INITIAL_AUDIT } = jiti(resolve(__dirname, '../../../mocks/sampleData.ts'));

/**
 * Normalized Trust Score calculation:
 * trust_score = supported / (supported + contradicted + unsupported) * 100
 */
function calculateTrustScore(supported, contradicted, unsupported) {
  const decisive = Math.max(0, (supported || 0) + (contradicted || 0) + (unsupported || 0));
  if (decisive === 0) return { score: null, decisive: 0 };
  const score = Math.round(((supported || 0) / decisive) * 1000) / 10;
  return { score, decisive };
}

function formatTrustScore(score) {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}%`;
}

describe('Trust Score Calculation & Coverage Domain Logic', () => {
  it('1. All claims supported produces 100%', () => {
    const { score, decisive } = calculateTrustScore(5, 0, 0);
    assert.equal(decisive, 5);
    assert.equal(score, 100);
    assert.equal(formatTrustScore(score), '100%');
  });

  it('2. Equal supported and contradicted claims produces 50%', () => {
    // 4 supported, 4 contradicted, 0 unsupported, 4 ambiguous
    const { score, decisive } = calculateTrustScore(4, 4, 0);
    assert.equal(decisive, 8);
    assert.equal(score, 50);
    assert.equal(formatTrustScore(score), '50%');
  });

  it('3. All claims contradicted produces 0%', () => {
    const { score, decisive } = calculateTrustScore(0, 5, 0);
    assert.equal(decisive, 5);
    assert.equal(score, 0);
    assert.equal(formatTrustScore(score), '0%');
  });

  it('4. Unsupported claims reduce the score by expanding the denominator', () => {
    const { score: score1, decisive: dec1 } = calculateTrustScore(1, 0, 1);
    assert.equal(dec1, 2);
    assert.equal(score1, 50);

    const { score: score2, decisive: dec2 } = calculateTrustScore(1, 1, 1);
    assert.equal(dec2, 3);
    assert.equal(score2, 33.3);
    assert.equal(formatTrustScore(score2), '33%');
  });

  it('5. Ambiguous and inconclusive claims are excluded from score denominator', () => {
    // 3 supported, 1 contradicted, 0 unsupported, 10 ambiguous/inconclusive
    const { score, decisive } = calculateTrustScore(3, 1, 0);
    assert.equal(decisive, 4);
    assert.equal(score, 75);
    assert.equal(formatTrustScore(score), '75%');
  });

  it('6. An audit containing only ambiguous/inconclusive claims yields null (N/A)', () => {
    const { score, decisive } = calculateTrustScore(0, 0, 0);
    assert.equal(decisive, 0);
    assert.equal(score, null);
    assert.equal(formatTrustScore(score), 'N/A');
  });

  it('7. Demo audit fixture displays exact score corresponding to verdict counts', () => {
    const summary = MOCK_INITIAL_AUDIT.summary;
    const { score, decisive } = calculateTrustScore(
      summary.supported_claims,
      summary.contradicted_claims,
      summary.unsupported_claims
    );
    assert.equal(decisive, 5);
    assert.equal(score, 0);
    assert.equal(summary.trust_score, 0.0);
    assert.equal(summary.decisive_claims, 5);
  });

  it('8. Prevents division by zero and preserves distinct 0% vs N/A', () => {
    const zeroDecisive = calculateTrustScore(0, 0, 0);
    const zeroScore = calculateTrustScore(0, 2, 0);

    assert.equal(zeroDecisive.score, null);
    assert.equal(formatTrustScore(zeroDecisive.score), 'N/A');

    assert.equal(zeroScore.score, 0);
    assert.equal(formatTrustScore(zeroScore.score), '0%');
    assert.notEqual(formatTrustScore(zeroDecisive.score), formatTrustScore(zeroScore.score));
  });
});
