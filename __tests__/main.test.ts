// Mocking OS for os.homedir()
jest.mock('os');

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {URL} from 'node:url';

import rimraf from 'rimraf';
import fetch from 'node-fetch';

import * as llvm from '../src/llvm';
import * as setup from '../src/setup';

const TEMP_LOCAL_PATH = path.join(__dirname, '..', 'TESTS_TEMP_DELETE');
const TEMP_HOME_DIR = path.join(TEMP_LOCAL_PATH, 'HOME');
const TEMP_CACHE_DIR = path.join(TEMP_LOCAL_PATH, 'CACHE');

jest.setTimeout(5 * 60 * 1000);

beforeAll(() => {
  if (fs.existsSync(TEMP_HOME_DIR)) rimraf.sync(TEMP_HOME_DIR);
  if (fs.existsSync(TEMP_CACHE_DIR)) rimraf.sync(TEMP_CACHE_DIR);
  if (fs.existsSync(TEMP_LOCAL_PATH)) rimraf.sync(TEMP_LOCAL_PATH);

  fs.mkdirSync(TEMP_LOCAL_PATH);
  fs.mkdirSync(TEMP_HOME_DIR);
  fs.mkdirSync(TEMP_CACHE_DIR);

  // Mocking os.homedir() result at the top of this file
  console.warn(`Testing home path: ${os.homedir()}`);

  // Env vars needed for the GitHub actions libs
  process.env['RUNNER_TEMP'] = TEMP_LOCAL_PATH;
  process.env['RUNNER_TOOL_CACHE'] = TEMP_CACHE_DIR;

  // Try to reduce GH lib verbosity
  process.env['ACTIONS_STEP_DEBUG'] = '';
  process.env['RUNNER_DEBUG'] = '';
});

afterAll(done => {
  if (fs.existsSync(TEMP_LOCAL_PATH)) {
    rimraf(TEMP_LOCAL_PATH, {disableGlob: true}, function () {
      done();
    });
  }
});

test('count llvm versions', () => {
  expect(llvm.availableVersions().length).toBeGreaterThan(0);
});

test('test url', () => {
  expect(llvm.distributionUrl('13.0.0', 'win32')).toStrictEqual(
    'https://github.com/ARM-software/LLVM-embedded-toolchain-for-Arm/releases/download/release-13.0.0/LLVMEmbeddedToolchainForArm-13.0.0-windows.zip'
  );
  expect(llvm.distributionUrl('16.0.0', 'win32')).toStrictEqual(
    'https://github.com/ARM-software/LLVM-embedded-toolchain-for-Arm/releases/download/release-16.0.0/LLVMEmbeddedToolchainForArm-16.0.0-Windows-x86_64.zip'
  );
  expect(llvm.distributionUrl('16.0.0', 'darwin')).toStrictEqual(
    'https://github.com/ARM-software/LLVM-embedded-toolchain-for-Arm/releases/download/release-16.0.0/LLVMEmbeddedToolchainForArm-16.0.0-Darwin.tar.gz'
  );
});

test('latest points to a known latest release', async () => {
  const knownLatestRelease = '16.0.0';

  const latestRelease = llvm.latestVersion();

  expect(latestRelease).toEqual(knownLatestRelease);
});

describe('Check links work.', () => {
  for (const version of llvm.availableVersions()) {
    let platforms = ['linux', 'win32'];
    if (llvm.hasDarwin(version)) {
      platforms.push('darwin');
    }
    for (const platform of platforms) {
      const fileUrl = llvm.distributionUrl(version, platform);
      const fileName = path.basename(new URL(fileUrl).pathname);

      test(`URL ${fileName} is working`, async () => {
        const response = await fetch(fileUrl, {method: 'HEAD'});
        expect(response.status).toBe(200);
      });
    }
  }
});

describe('Real install in temp dirs.', () => {
  function hasClang(dir: string): boolean {
    for (const filename of ['clang', 'clang.exe']) {
      const exe = path.join(dir, filename);
      if (fs.existsSync(exe)) {
        console.log(`✅ Executable exists: ${exe}`);
        return true;
      }
    }
    return false;
  }

  async function tmpInstall(release: string, platform: string): Promise<void> {
    const installPath = await setup.install(release, platform);
    const llvmPath = setup.findClang(installPath, platform);
    expect(llvmPath).not.toBe('');
    expect(hasClang(llvmPath)).toBeTruthy();
  }

  test('13.0.0 linux', async () => await tmpInstall('13.0.0', 'linux'));
  test('15.0.2 win32', async () => await tmpInstall('15.0.2', 'win32'));
  test('15.0.2 linux', async () => await tmpInstall('15.0.2', 'linux'));
  test('16.0.0 linux', async () => await tmpInstall('16.0.0', 'linux'));
  test('16.0.0 darwin', async () => await tmpInstall('16.0.0', 'darwin'));
  test('16.0.0 win32', async () => await tmpInstall('16.0.0', 'win32'));
});
