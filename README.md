# GitHub Action: LLVM Embedded Toolchain for ARM

[![CI](https://github.com/stellar-aria/llvm-embedded-toolchain-for-arm-action/actions/workflows/test.yml/badge.svg)](https://github.com/stellar-aria/llvm-embedded-toolchain-for-arm-action/workflows/test.yml)

This GitHub Action (compatible with Linux, Windows, and macOS platforms)
downloads, checks, sets up, and caches the LLVM Embbedded Toolchain for Arm.


## Usage

Simplest way to use this action is with the default options, which uses the
the latest LLVM Embbedded Toolchain for Arm release:

```yaml
steps:
- uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
- run: clang --version
```

You can also specify a version (a list can be found in the
[Available releases](#available-releases) section):

```yaml
steps:
- name: Install LLVM Embedded Toolchain for Arm
  uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
  with:
    release: '15.0.2' # <-- The compiler release to use
```

More information can be found in the [Advanced Options](#advanced-options)
section.


## Available releases

- `latest` <-- Always points to the latest release
- `19.1.1` (macOS, Windows, Linux)
- `18.1.3` (macOS, Windows, Linux)
- `17.0.1` (macOS, Windows, Linux)
- `16.0.0` (macOS, Windows, Linux)
- `15.0.2` (Windows, Linux)
- `14.0.0` (Windows, Linux)
- `13.0.0` (Windows, Linux)


## Advanced options

You can use a "job matrix" to build/test your project with multiple versions
of LLVM:

```yaml
jobs:
  build:
    strategy:
      matrix:
        llvm: ['13', 'latest']
    steps:
      - name: Install LLVM Embedded Toolchain for Arm - ${{ matrix.llvm }}
        uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
        with:
          release: ${{ matrix.llvm }}
      - run: clang --version
```

If you need to pass the clang path to a different action or step the `path`
output exports it:

```yaml
- name: To access a step output, you need to provide an `id`
  uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
  id: llvm-embedded-toolchain-for-arm-action
- name: The `path` to the toolchain executables can then be obtained as an output
  run: echo "The output path is ${{ steps.llvm-embedded-toolchain-for-arm-action.outputs.path }}"
```

The path can also be added to an environmental variable if it's specified as
an input:

```yaml
- name: To create an environmental variable with the toolchain path provide a name via the `path-env-var` input
  uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
  with:
    path-env-var: LLVM_ARM_PATH
- name: The path will be exported to that environmental variable name
  run: echo "The output path is $LLVM_ARM_PATH"
```

For access to the entire toolchain path, you can use the `toolchain` output.

```yaml
- name: To access a step output, you need to provide an `id`
  uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
  id: llvm-embedded-toolchain-for-arm-action
- name: The `toolchain` path can then be obtained as an output
  run: echo "The output path is ${{ steps.llvm-embedded-toolchain-for-arm-action.outputs.toolchain }}"
```

The toolchain can also be added to an environmental variable if it's specified as
an input:

```yaml
- name: To create an environmental variable with the toolchain path provide a name via the `toolchain-env-var` input
  uses: stellar-aria/llvm-embedded-toolchain-for-arm-action@latest
  with:
    toolchain-env-var: LLVM_ARM_TOOLCHAIN
- name: The path will be exported to that environmental variable name
  run: echo "The output path is $LLVM_ARM_TOOLCHAIN"
```


## License & Attribution

[MIT License](LICENSE).

This project is a fork of [carlosperate/arm-none-eabi-gcc-action](https://github.com/carlosperate/arm-none-eabi-gcc-action), copyright [@carlosperate](https://github.com/carlosperate) which in turn is a fork of [fiam/arm-none-eabi-gcc](https://github.com/fiam/arm-none-eabi-gcc), copyright [@fiam](https://github.com/fiam).
