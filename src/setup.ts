import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import * as dmg from 'dmg';
import sha256File from 'sha256-file';

import * as llvm from './llvm';

function extractDmg(filename: string, destination: string): void {
  dmg.mount(filename, (em, mountPath) => {
    if (em) {
      core.error(em);
      return;
    }

    fs.copy(mountPath, destination);

    dmg.unmount(mountPath, eu => {
      if (eu) {
        core.error(eu);
        return;
      }
    });
  });
}

export async function install(release: string, platform: string): Promise<string> {
  const toolName = 'llvm-embedded-toolchain-for-arm';

  // Get the LLVM release info
  const distUrl: string = llvm.distributionUrl(release, platform);

  const cacheKey = `${toolName}-${release}-${platform}`;
  const installPath = path.join(os.homedir(), cacheKey);
  core.debug(`Cache key: ${cacheKey}`);

  // Try to load the LLVM installation from the cache
  let cacheKeyMatched: string | undefined = undefined;
  try {
    cacheKeyMatched = await cache.restoreCache([installPath], cacheKey);
    core.debug(`Matched cache.restoreCache() key: ${cacheKeyMatched}`);
  } catch (err) {
    core.warning(`⚠️ Could not find contents in the cache.\n${err.message}`);
  }
  if (cacheKeyMatched === cacheKey) {
    core.info(`Cache found: ${installPath}`);
    if (llvm.hasSHA256(release)) {
      const distHash = await llvm.getSHA256(release, platform);

      let cacheSHA256 = 'SHA256 not found in cached installation';
      try {
        cacheSHA256 = await fs.promises.readFile(path.join(installPath, 'sha256.txt'), {encoding: 'utf8'});
      } catch (err) {
        core.warning(`⚠️ Could not read the contents of the cached LLVM version SHA256.\n${err.message}`);
      }
      core.info(`Cached version SHA256: ${cacheSHA256}`);
      if (cacheSHA256 !== distHash) {
        core.warning(`⚠️ Cached version SHA256 does not match: ${cacheSHA256} != ${distHash}`);
      } else {
        core.info('Cached version loaded.');
        return installPath;
      }
    }
  }

  core.info(`Cache miss, downloading LLVM ${release} from ${distUrl}`);
  const llvmDownloadPath = await tc.downloadTool(distUrl);

  core.info(`LLVM release downloaded, calculating SHA256...`);
  const downloadHash: string = sha256File(llvmDownloadPath);

  core.info(`Downloaded file SHA256: ${downloadHash}`);
  if (llvm.hasSHA256(release)) {
    const distHash: string = await llvm.getSHA256(release, platform);
    if (downloadHash !== distHash) {
      throw new Error(
        `Downloaded LLVM SHA256 doesn't match expected value: ${downloadHash} != ${distHash}, lengths: ${downloadHash.length}, ${distHash.length}`
      );
    }
  }

  core.info(`Extracting ${llvmDownloadPath}`);
  let extractedPath = '';
  if (distUrl.endsWith('.zip')) {
    extractedPath = await tc.extractZip(llvmDownloadPath, installPath);
  } else if (distUrl.endsWith('.tar.gz')) {
    extractedPath = await tc.extractTar(llvmDownloadPath, installPath);
  } else if (distUrl.endsWith('.tar.xz')) {
    extractedPath = await tc.extractTar(llvmDownloadPath, installPath, 'xJ');
  } else if (distUrl.endsWith('.dmg')) {
    extractDmg(llvmDownloadPath, installPath);
    extractedPath = installPath;
  } else {
    throw new Error(`Can't decompress ${distUrl}`);
  }

  // Adding installation to the cache
  core.info(`Adding to cache: ${extractedPath}`);
  await fs.promises.writeFile(path.join(extractedPath, 'sha256.txt'), downloadHash, {encoding: 'utf8'});
  try {
    await cache.saveCache([extractedPath], cacheKey);
  } catch (err) {
    core.warning(`⚠️ Could not save to the cache.\n${err.message}`);
  }

  return extractedPath;
}

function findRecursive(dir: string, executableName: string): string {
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    if (name === executableName) {
      return dir;
    }
    const p = path.join(dir, name);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      const result = findRecursive(p, executableName);
      if (result !== '') {
        return result;
      }
    }
  }
  return '';
}

export function findClang(root: string, platform?: string): string {
  platform = platform || process.platform;
  return findRecursive(root, `clang${platform === 'win32' ? '.exe' : ''}`);
}
