# companion-module-behringer-x32

## Getting started

Executing a `yarn` command should perform all necessary steps to develop the module, if it does not then follow the steps below.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn build:watch` the compiler will be run in watch mode to recompile the files on change.

## Changes

### v2.2.0

- Set level of bus send to matrix

- Mute/unmute bus send to matrix

- Set level of channel send to bus

- Talkback on/off

### v2.1.0

- Fix initial state loading

- Fix mute toggle actions not always working on first use

- Mute/unmute channel send to buses

### v2.0.0

- Rewrite in Typescript with some linting and formatting rules.

- Added Mute feedback

- Added variables for channel names and fader levels

- Use slider inputs for fader levels

- Rework channel selection to use a proper list with current names
