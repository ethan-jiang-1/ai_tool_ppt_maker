import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createHtmlFirstRun } from './helpers/html_first_fixture.mjs';
import {
  HTML_FINAL_SLIDES_MANIFEST_SCHEMA,
  acquireHtmlPublishLock,
  ensureHtmlOwnerRoot,
  htmlOwnerRoot,
  publishHtmlCurrentManifest,
  readHtmlCurrentManifest,
  readHtmlPublishLock,
  recoverHtmlPublishLock,
  releaseHtmlPublishLock,
  writeHtmlObject,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/html_object_store.mjs';
import { finalSlideFingerprintV1 } from '../PPTMAKER_FRAMEWORK/scripts/lib/render_artifacts.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');

describe('HTML immutable object/current manifest store', () => {
  it('addresses objects by raw bytes and atomically publishes a schema-closed manifest', () => {
    const fixture = createHtmlFirstRun('html-objects-');
    try {
      const ownerRoot = ensureHtmlOwnerRoot(fixture.runDir, 'final-slides');
      const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'final-slides', publicationScope: 'canonical-run', inputScopeSha256: sha('inputs') });
      const object = writeHtmlObject({ ownerRoot, bytes: Buffer.from('png-bytes'), extension: 'png', ownerToken: lock.ownerToken });
      expect(object.sha256).toBe(sha('png-bytes'));
      expect(existsSync(join(ownerRoot, object.path))).toBe(true);
      const compositionFingerprint = sha('composition');
      const committed = publishHtmlCurrentManifest({ ownerRoot, ownerToken: lock.ownerToken, schema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA, publicationScope: 'canonical-run', htmlProductionResetId: null, entries: [{ slide_id: 'AlphaGo', artifact_kind: 'final-slide', producer: 'html-compositor-v1', composition_variant: 'effective', html_sha256: sha('html'), composition_fingerprint: compositionFingerprint, final_slide_fingerprint: finalSlideFingerprintV1({ producer: 'html-compositor-v1', producerPrivateFingerprint: compositionFingerprint, byteSha256: object.sha256, width: 2000, height: 1125, mediaProfile: 'html-capture-v1' }), path: object.path, sha256: object.sha256, width: 2000, height: 1125, media_profile: 'html-capture-v1' }], priorManifestSha256: null });
      expect(committed.manifest.schema).toBe(HTML_FINAL_SLIDES_MANIFEST_SCHEMA);
      const read = readHtmlCurrentManifest(ownerRoot, { expectedSchema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA, publicationScope: 'canonical-run', htmlProductionResetId: null });
      expect(read.manifest.entries[0].sha256).toBe(object.sha256);
      expect(readHtmlPublishLock(ownerRoot).ownerToken).toBe(lock.ownerToken);
      releaseHtmlPublishLock(lock);
      expect(readHtmlPublishLock(ownerRoot)).toBeNull();
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('fails closed on lock conflicts, scope/reset drift, malformed owner records, and stale CAS', () => {
    const fixture = createHtmlFirstRun('html-objects-conflict-');
    try {
      const ownerRoot = ensureHtmlOwnerRoot(fixture.runDir, 'html-pages');
      const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'html-pages', publicationScope: 'migration-preview', inputScopeSha256: sha('inputs') });
      expect(() => acquireHtmlPublishLock({ ownerRoot, ownerKind: 'html-pages', publicationScope: 'migration-preview', inputScopeSha256: sha('other') })).toThrow(/CONFLICT/);
      expect(() => publishHtmlCurrentManifest({ ownerRoot, ownerToken: lock.ownerToken, schema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA, publicationScope: 'canonical-run', htmlProductionResetId: null, entries: [], priorManifestSha256: null })).toThrow(/scope/);
      expect(readHtmlCurrentManifest(ownerRoot, { expectedSchema: 'pptmaker-html-pages-manifest-v1', publicationScope: 'canonical-run', htmlProductionResetId: null })).toBeNull();
      releaseHtmlPublishLock(lock);
      mkdirSync(join(ownerRoot, '.publish.lock'), { recursive: true });
      writeFileSync(join(ownerRoot, '.publish.lock', 'owner.json'), '{}');
      expect(() => readHtmlPublishLock(ownerRoot)).toThrow(/CONFLICT/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects symlinked object ownership and routes canonical uncertain recovery to full reset', () => {
    const fixture = createHtmlFirstRun('html-objects-confinement-');
    try {
      const ownerRoot = ensureHtmlOwnerRoot(fixture.runDir, 'html-pages');
      const outside = join(fixture.root, 'outside'); mkdirSync(outside);
      rmSync(join(ownerRoot, 'objects'), { recursive: true, force: true });
      symlinkSync(outside, join(ownerRoot, 'objects'));
      const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'html-pages', publicationScope: 'canonical-run', inputScopeSha256: sha('inputs'), now: 1, pid: 99999999, host: 'foreign-host' });
      expect(() => writeHtmlObject({ ownerRoot, bytes: Buffer.from('x'), extension: 'html', ownerToken: lock.ownerToken })).toThrow(/symlink/);
      expect(() => recoverHtmlPublishLock(ownerRoot, { now: 300001, host: 'local-host', confirmedOwnerToken: lock.ownerToken })).toThrow(/whole HTML production reset/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('recovers only an old same-host dead owner or an explicitly confirmed old foreign owner', () => {
    const fixture = createHtmlFirstRun('html-objects-recovery-');
    try {
      const ownerRoot = ensureHtmlOwnerRoot(fixture.runDir, 'preview');
      const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'preview', publicationScope: 'canonical-run', inputScopeSha256: sha('inputs'), now: 1, pid: 99999999 });
      mkdirSync(join(ownerRoot, 'objects', `.object.${lock.ownerToken}.orphan.tmp`));
      expect(recoverHtmlPublishLock(ownerRoot, { now: 60001 })).toMatchObject({ status: 'recovered', mode: 'same-host-dead' });
      const foreign = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'preview', publicationScope: 'migration-preview', inputScopeSha256: sha('inputs'), now: 1, pid: 99999999, host: 'foreign-host' });
      expect(() => recoverHtmlPublishLock(ownerRoot, { now: 300001, host: 'local-host' })).toThrow(/confirmation/);
      expect(recoverHtmlPublishLock(ownerRoot, { now: 300001, host: 'local-host', confirmedOwnerToken: foreign.ownerToken })).toMatchObject({ status: 'recovered', mode: 'confirmed-owner' });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
