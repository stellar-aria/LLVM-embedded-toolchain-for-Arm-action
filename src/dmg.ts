import {exec as execCallback} from 'child_process';
import {promisify} from 'util';

const exec = promisify(execCallback);
const volumeRegex = /\/Volumes\/(.*)/m;

/**
 * Mount a dmg file and return its mounted path.
 *
 * @param {string} path location of .dmg.
 * @returns {Promise<string>} Promise resolving to the mounted volume path.
 */
export async function mount(path: string): Promise<string> {
  const {stdout} = await exec(`hdiutil mount "${path}"`);
  const match: RegExpMatchArray | null = stdout.match(volumeRegex);

  if (!match) {
    throw new Error('Could not extract path out of mount result: ' + stdout);
  }

  return match[0];
}

/**
 * Unmount a dmg volume.
 *
 * @param {string} path to unmount.
 * @returns {Promise<void>} Promise resolving when unmount is complete.
 */
export async function unmount(path: string): Promise<void> {
  if (!volumeRegex.test(path)) {
    throw new Error('Path must contain /Volumes/');
  }

  await exec(`hdiutil unmount "${path}"`);
}
