import * as core from '@actions/core';

import * as setup from './setup';
import {latestVersion} from './llvm';
import path from 'node:path';

async function run(): Promise<void> {
  try {
    let release = core.getInput('release');
    if (!release || release === 'latest') {
      release = latestVersion();
    }
    const installPath = await setup.install(release, process.platform);
    const clangPath = setup.findClang(installPath);
    const toolchainPath = path.resolve(clangPath, '..');

    if (!clangPath) {
      throw new Error(`Could not find clang executable in ${clangPath}`);
    }
    core.info(`Adding ${clangPath} to PATH.`);
    core.addPath(clangPath);

    // Export path for other tools
    core.setOutput('path', clangPath);
    const pathEnvVar = core.getInput('path-env-var');
    if (pathEnvVar) {
      core.exportVariable(pathEnvVar, clangPath);
    }

    core.setOutput('toolchain', toolchainPath);
    const toolchainEnvVar = core.getInput('toolchain-env-var');
    if (toolchainEnvVar) {
      core.exportVariable(toolchainEnvVar, toolchainPath);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
