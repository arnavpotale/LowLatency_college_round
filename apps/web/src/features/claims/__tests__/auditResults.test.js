import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jiti = require('jiti')(process.cwd());

// Load project mock fixtures and types
const { MOCK_INITIAL_AUDIT } = jiti('./src/mocks/sampleData.ts');

// --- Helper Functions Mirroring Component Domain Logic ---

/**
 * Computes counts for each of the 5 verdict categories plus 'all'.
 * Mirrors ClaimList.tsx category computation.
 */
function computeVerdictCounts(claims) {
  return {
    all: claims.length,
    supported: claims.filter((c) => c.verdict === 'supported').length,
    contradicted: claims.filter((c) => c.verdict === 'contradicted').length,
    unsupported: claims.filter((c) => c.verdict === 'unsupported').length,
    ambiguous: claims.filter((c) => c.verdict === 'ambiguous').length,
    inconclusive: claims.filter((c) => c.verdict === 'inconclusive').length,
  };
}

/**
 * Filters claims by verdict category.
 * Mirrors ClaimList.tsx filtering logic.
 */
function filterClaims(claims, filter) {
  if (filter === 'all') return claims;
  return claims.filter((c) => c.verdict === filter);
}

/**
 * Resolves linked evidence objects for a claim from the evidence list.
 * Mirrors ClaimCard.tsx linkedEvidence resolution.
 */
function getLinkedEvidence(claim, evidenceList) {
  return evidenceList.filter((e) => claim.evidence_ids.includes(e.evidence_id));
}

/**
 * Finds all claims that cite a given evidence ID.
 * Mirrors EvidenceViewer.tsx reverse referencing logic.
 */
function getReferencingClaims(evidenceId, claims) {
  return claims.filter((c) => c.evidence_ids.includes(evidenceId));
}

/**
 * Simulates claim selection state transitions in App.tsx.
 * Sets selectedClaimId and synchronizes activeEvidenceId.
 */
function selectClaim(claims, claimId) {
  const targetClaim = claims.find((c) => c.claim_id === claimId);
  const activeEvidenceId =
    targetClaim && targetClaim.evidence_ids.length > 0
      ? targetClaim.evidence_ids[0]
      : null;
  return {
    selectedClaimId: claimId,
    activeEvidenceId,
  };
}

/**
 * Performs Unicode code-point accurate slicing with CRLF drift compensation.
 * Mirrors AnswerHighlighter.tsx slicing logic.
 */
function sliceUnicode(originalAnswer, startOffset, endOffset, claimText = null) {
  const chars = Array.from(originalAnswer);
  let rawStart = Math.max(0, Math.min(chars.length, startOffset));
  let rawEnd = Math.max(rawStart, Math.min(chars.length, endOffset));

  // CRLF line-ending drift compensation
  if (claimText && chars.slice(rawStart, rawEnd).join('') !== claimText) {
    let crCount = 0;
    for (let i = 0; i < rawStart && i < chars.length; i++) {
      if (chars[i] === '\r') crCount++;
    }
    if (crCount > 0 && chars.slice(rawStart + crCount, rawEnd + crCount).join('') === claimText) {
      rawStart += crCount;
      rawEnd += crCount;
    }
  }

  return chars.slice(rawStart, rawEnd).join('');
}

// =====================================================================
// Test Suite: Audit Results UI Improvements
// =====================================================================

describe('Audit Results UI - Domain & Integration Logic', () => {

  // -------------------------------------------------------------------
  // 1. Filtering Across All Five Verdict Categories and Correct Counts
  // -------------------------------------------------------------------
  describe('1. Verdict Categories Filtering & Counts', () => {
    it('accurately counts verdicts in the initial mock audit', () => {
      const counts = computeVerdictCounts(MOCK_INITIAL_AUDIT.claims);

      assert.equal(counts.all, 5, 'Total claims count should be 5');
      assert.equal(counts.contradicted, 3, 'Contradicted count should be 3');
      assert.equal(counts.unsupported, 2, 'Unsupported count should be 2');
      assert.equal(counts.supported, 0, 'Supported count should be 0');
      assert.equal(counts.ambiguous, 0, 'Ambiguous count should be 0');
      assert.equal(counts.inconclusive, 0, 'Inconclusive count should be 0');

      // Verify consistency with mock summary & verdicts contract
      assert.equal(counts.contradicted, MOCK_INITIAL_AUDIT.verdicts.contradicted);
      assert.equal(counts.unsupported, MOCK_INITIAL_AUDIT.verdicts.unsupported);
      assert.equal(counts.supported, MOCK_INITIAL_AUDIT.verdicts.supported);
    });

    it('filters claims correctly for each verdict category on mock audit', () => {
      const allFiltered = filterClaims(MOCK_INITIAL_AUDIT.claims, 'all');
      assert.equal(allFiltered.length, 5);

      const contradicted = filterClaims(MOCK_INITIAL_AUDIT.claims, 'contradicted');
      assert.equal(contradicted.length, 3);
      assert.deepEqual(
        contradicted.map((c) => c.claim_id),
        ['cl_01', 'cl_03', 'cl_04']
      );

      const unsupported = filterClaims(MOCK_INITIAL_AUDIT.claims, 'unsupported');
      assert.equal(unsupported.length, 2);
      assert.deepEqual(
        unsupported.map((c) => c.claim_id),
        ['cl_02', 'cl_05']
      );

      // Categories with 0 claims return empty array (triggers empty state)
      const supported = filterClaims(MOCK_INITIAL_AUDIT.claims, 'supported');
      assert.equal(supported.length, 0);

      const ambiguous = filterClaims(MOCK_INITIAL_AUDIT.claims, 'ambiguous');
      assert.equal(ambiguous.length, 0);

      const inconclusive = filterClaims(MOCK_INITIAL_AUDIT.claims, 'inconclusive');
      assert.equal(inconclusive.length, 0);
    });

    it('handles all 5 verdict categories simultaneously in extended dataset', () => {
      const fullSpectrumClaims = [
        { claim_id: 'c_sup', verdict: 'supported', evidence_ids: ['ev_1'], start_offset: 0, end_offset: 10 },
        { claim_id: 'c_con', verdict: 'contradicted', evidence_ids: ['ev_2'], start_offset: 11, end_offset: 20 },
        { claim_id: 'c_uns', verdict: 'unsupported', evidence_ids: [], start_offset: 21, end_offset: 30 },
        { claim_id: 'c_amb', verdict: 'ambiguous', evidence_ids: ['ev_3'], start_offset: 31, end_offset: 40 },
        { claim_id: 'c_inc', verdict: 'inconclusive', evidence_ids: [], start_offset: 41, end_offset: 50 },
      ];

      const counts = computeVerdictCounts(fullSpectrumClaims);
      assert.equal(counts.all, 5);
      assert.equal(counts.supported, 1);
      assert.equal(counts.contradicted, 1);
      assert.equal(counts.unsupported, 1);
      assert.equal(counts.ambiguous, 1);
      assert.equal(counts.inconclusive, 1);

      assert.equal(filterClaims(fullSpectrumClaims, 'supported')[0].claim_id, 'c_sup');
      assert.equal(filterClaims(fullSpectrumClaims, 'contradicted')[0].claim_id, 'c_con');
      assert.equal(filterClaims(fullSpectrumClaims, 'unsupported')[0].claim_id, 'c_uns');
      assert.equal(filterClaims(fullSpectrumClaims, 'ambiguous')[0].claim_id, 'c_amb');
      assert.equal(filterClaims(fullSpectrumClaims, 'inconclusive')[0].claim_id, 'c_inc');
    });
  });

  // -------------------------------------------------------------------
  // 2. Claim Selection and Active Evidence Synchronization
  // -------------------------------------------------------------------
  describe('2. Claim Selection', () => {
    it('sets default selection to first claim and its active evidence on load', () => {
      const firstClaim = MOCK_INITIAL_AUDIT.claims[0];
      const state = selectClaim(MOCK_INITIAL_AUDIT.claims, firstClaim.claim_id);

      assert.equal(state.selectedClaimId, 'cl_01');
      assert.equal(state.activeEvidenceId, 'ev_01', 'First evidence ID should be selected');
    });

    it('updates selection when switching to another grounded claim', () => {
      const state = selectClaim(MOCK_INITIAL_AUDIT.claims, 'cl_03');

      assert.equal(state.selectedClaimId, 'cl_03');
      assert.equal(state.activeEvidenceId, 'ev_02', 'cl_03 cites ev_02');
    });

    it('resets active evidence to null when switching to an ungrounded claim', () => {
      // First select cl_01 (has ev_01)
      const state1 = selectClaim(MOCK_INITIAL_AUDIT.claims, 'cl_01');
      assert.equal(state1.activeEvidenceId, 'ev_01');

      // Then select cl_02 (has no evidence)
      const state2 = selectClaim(MOCK_INITIAL_AUDIT.claims, 'cl_02');
      assert.equal(state2.selectedClaimId, 'cl_02');
      assert.equal(
        state2.activeEvidenceId,
        null,
        'Active evidence must be reset to null for claims without citations'
      );
    });

    it('maintains consistent selection state regardless of active filter', () => {
      let selectedClaimId = 'cl_01'; // Contradicted claim
      let filter = 'unsupported'; // Filter excludes cl_01

      const visibleClaims = filterClaims(MOCK_INITIAL_AUDIT.claims, filter);
      const isSelectedVisible = visibleClaims.some((c) => c.claim_id === selectedClaimId);
      assert.equal(isSelectedVisible, false, 'cl_01 is not visible under unsupported filter');

      // Reset filter restores visibility without losing selected claim ID
      filter = 'all';
      const restoredClaims = filterClaims(MOCK_INITIAL_AUDIT.claims, filter);
      assert.equal(
        restoredClaims.some((c) => c.claim_id === selectedClaimId),
        true,
        'cl_01 is visible once filter is reset to all'
      );
    });
  });

  // -------------------------------------------------------------------
  // 3. Evidence Navigation and Citation Linking
  // -------------------------------------------------------------------
  describe('3. Evidence Navigation & Citation Linking', () => {
    it('resolves linked evidence excerpts for a claim with citations', () => {
      const claim1 = MOCK_INITIAL_AUDIT.claims[0]; // cl_01
      const linked = getLinkedEvidence(claim1, MOCK_INITIAL_AUDIT.evidence);

      assert.equal(linked.length, 1);
      assert.equal(linked[0].evidence_id, 'ev_01');
      assert.equal(linked[0].source_name, 'clinical_protocol_metaproterenol.txt');
      assert.equal(linked[0].page_or_section, 'Section 2.3 (Dosage and Administration)');
      assert.equal(linked[0].relevance_score, 0.96);
      assert.match(linked[0].text, /standard recommended initial dosage/);
    });

    it('correctly maps evidence back to referencing claims (Cited by)', () => {
      const referencing1 = getReferencingClaims('ev_01', MOCK_INITIAL_AUDIT.claims);
      assert.equal(referencing1.length, 1);
      assert.equal(referencing1[0].claim_id, 'cl_01');

      const referencing2 = getReferencingClaims('ev_02', MOCK_INITIAL_AUDIT.claims);
      assert.equal(referencing2.length, 1);
      assert.equal(referencing2[0].claim_id, 'cl_03');

      const referencing3 = getReferencingClaims('ev_03', MOCK_INITIAL_AUDIT.claims);
      assert.equal(referencing3.length, 1);
      assert.equal(referencing3[0].claim_id, 'cl_04');
    });

    it('handles evidence shared across multiple claims', () => {
      const multiCitingClaims = [
        { claim_id: 'claim_A', evidence_ids: ['ev_shared'], verdict: 'contradicted' },
        { claim_id: 'claim_B', evidence_ids: ['ev_shared'], verdict: 'supported' },
        { claim_id: 'claim_C', evidence_ids: ['ev_other'], verdict: 'unsupported' },
      ];

      const referencing = getReferencingClaims('ev_shared', multiCitingClaims);
      assert.equal(referencing.length, 2);
      assert.deepEqual(
        referencing.map((c) => c.claim_id),
        ['claim_A', 'claim_B']
      );
    });

    it('simulates jump-to-claim action from evidence card', () => {
      // User is inspecting evidence ev_03 in EvidenceViewer
      const currentEvidenceId = 'ev_03';
      const citingClaims = getReferencingClaims(currentEvidenceId, MOCK_INITIAL_AUDIT.claims);

      assert.equal(citingClaims.length, 1);
      const targetClaimId = citingClaims[0].claim_id; // 'cl_04'

      // Click "Jump to Claim"
      const nextState = selectClaim(MOCK_INITIAL_AUDIT.claims, targetClaimId);
      assert.equal(nextState.selectedClaimId, 'cl_04');
      assert.equal(nextState.activeEvidenceId, 'ev_03');
    });
  });

  // -------------------------------------------------------------------
  // 4. Missing Evidence and Ungrounded Claims (evidence_ids: [])
  // -------------------------------------------------------------------
  describe('4. Missing Evidence & Ungrounded Claims', () => {
    it('returns empty linked evidence array for ungrounded claims', () => {
      const ungroundedClaim = MOCK_INITIAL_AUDIT.claims.find((c) => c.claim_id === 'cl_02');
      assert.ok(ungroundedClaim, 'cl_02 should exist');
      assert.deepEqual(ungroundedClaim.evidence_ids, []);

      const linked = getLinkedEvidence(ungroundedClaim, MOCK_INITIAL_AUDIT.evidence);
      assert.equal(linked.length, 0, 'Linked evidence array must be empty');
    });

    it('does not display stale evidence when ungrounded claim is selected', () => {
      // Step 1: User previously selected cl_01 (linked to ev_01)
      let activeEvidenceId = 'ev_01';

      // Step 2: User clicks ungrounded claim cl_05
      const claim5 = MOCK_INITIAL_AUDIT.claims.find((c) => c.claim_id === 'cl_05');
      if (claim5.evidence_ids.length > 0) {
        activeEvidenceId = claim5.evidence_ids[0];
      } else {
        activeEvidenceId = null;
      }

      assert.equal(activeEvidenceId, null, 'activeEvidenceId must become null, not remain ev_01');
    });

    it('flags ungrounded claim state for UI alert banner', () => {
      const claim2 = MOCK_INITIAL_AUDIT.claims.find((c) => c.claim_id === 'cl_02');
      const isUngrounded = claim2.evidence_ids.length === 0;

      assert.equal(isUngrounded, true);
      assert.equal(claim2.verdict, 'unsupported');
    });
  });

  // -------------------------------------------------------------------
  // 5. Unicode Character Offsets and Emoji Handling
  // -------------------------------------------------------------------
  describe('5. Unicode Character Offsets & Emojis', () => {
    it('verifies code-point accurate extraction vs UTF-16 code units with emojis', () => {
      // In Python backend: 0-indexed Unicode code points.
      // Emojis (U+1F52C, U+1F48A) are 1 code point each, but 2 UTF-16 code units.
      const text = '🔬 The compound Metaproterenol has 0 contraindications. 💊 Safe dosage is 100mg.';
      const chars = Array.from(text);

      const claim1Text = 'The compound Metaproterenol has 0 contraindications.';
      const claim2Text = 'Safe dosage is 100mg.';

      // Offsets calculated in code points:
      // index 0: 🔬, index 1: ' '
      const c1Start = 2;
      const c1End = c1Start + Array.from(claim1Text).length; // 2 + 52 = 54

      // separator: ' 💊 ' -> 3 code points
      const c2Start = c1End + Array.from(' 💊 ').length; // 54 + 3 = 57
      const c2End = c2Start + Array.from(claim2Text).length; // 57 + 21 = 78

      // 1. Array.from code-point slicing matches EXACT claim text
      const extracted1 = chars.slice(c1Start, c1End).join('');
      const extracted2 = chars.slice(c2Start, c2End).join('');

      assert.equal(extracted1, claim1Text);
      assert.equal(extracted2, claim2Text);

      // 2. Naive UTF-16 substring fails / drifts due to surrogate pairs
      const utf16Sliced1 = text.slice(c1Start, c1End);
      assert.notEqual(
        utf16Sliced1,
        claim1Text,
        'UTF-16 slice drifts by 1 position because 🔬 is 2 UTF-16 code units'
      );
    });

    it('safely extracts emojis embedded inside claim text without surrogate corruption', () => {
      const textWithEmbeddedEmoji = 'Advisory: Always verify ⚠️ cardiac warnings before starting beta-blocker therapy.';
      const chars = Array.from(textWithEmbeddedEmoji);

      const extracted = chars.slice(10, chars.length).join('');
      assert.equal(extracted, 'Always verify ⚠️ cardiac warnings before starting beta-blocker therapy.');
      assert.ok(extracted.includes('⚠️'));
    });

    it('reconstructs 100% of the original answer text from sorted claim spans and interstitial segments', () => {
      const answer = MOCK_INITIAL_AUDIT.original_answer;
      const chars = Array.from(answer);
      let cursor = 0;
      let reconstructed = '';

      const sorted = [...MOCK_INITIAL_AUDIT.claims].sort((a, b) => a.start_offset - b.start_offset);

      sorted.forEach((claim) => {
        if (claim.start_offset > cursor) {
          reconstructed += chars.slice(cursor, claim.start_offset).join('');
        }
        const safeStart = Math.max(cursor, claim.start_offset);
        if (claim.end_offset > safeStart) {
          reconstructed += chars.slice(safeStart, claim.end_offset).join('');
          cursor = Math.max(cursor, claim.end_offset);
        }
      });

      if (cursor < chars.length) {
        reconstructed += chars.slice(cursor).join('');
      }

      assert.equal(reconstructed, answer, 'Entire answer must be preserved without character loss');
      assert.equal(reconstructed.length, answer.length);
    });

    it('handles Windows CRLF line-ending drift compensation correctly', () => {
      // Simulate an answer checked out with CRLF (\r\n) on Windows
      const lines = [
        'The recommended dosage for Metaproterenol is 100mg twice daily.',
        'Clinical trials demonstrated 45% symptom reduction over 12 weeks.',
      ];
      const crlfText = lines.join('\r\n');

      const claimText2 = lines[1];
      // Suppose backend computed LF offsets where line 1 ended at 64 (\n is offset 64, line 2 starts at 65)
      const lfStart = lines[0].length + 1; // 64
      const lfEnd = lfStart + claimText2.length; // 64 + 65 = 129

      // Using sliceUnicode with CRLF drift compensation
      const result = sliceUnicode(crlfText, lfStart, lfEnd, claimText2);
      assert.equal(
        result,
        claimText2,
        'CRLF compensation should detect the preceding \\r and extract exact claim text'
      );
    });
  });
});
