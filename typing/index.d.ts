declare module 'dmg' {
  /**
   * Mount a dmg file and return its mounted path.
   *
   * @param {String} path location of .dmg.
   * @param {Function} callback [Error err, String mountedVolume].
   */
  export function mount(path: string, callback: (err: Error | null, volumePath: string) => void): void;
  /**
   * Unmount a dmg volume.
   *
   * @param {String} path to unmount.
   * @param {Function} callback [Error err]
   */
  export function unmount(path: string, callback: (err: Error) => void): void;
}
