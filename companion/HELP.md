**Midas M32 / Behringer X32**

This Module controls the Midas M32 series and Behringer X32 series of consoles
go over to [Midas](http://www.musictri.be/Categories/Midas/Mixers/Digital/M32/p/P0B3I) or [Behringer](http://www.musictri.be/Categories/Behringer/Mixers/Digital/X32/p/P0ASF)
to get additional information about the consoles and their capabilities.

We support the following actions:

| Console Function                                               | What it does                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono mute  | Mutes or Unmutes the selected Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono                             |
| Channel, AuxIn, FxReturn, Bus, Matrix. Main Stereo, Mono fader | Sets the level of the selected Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono fader                      |
| Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono label | Sets the text label in the scribble strip of the selected Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono |
| Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono       | Sets the color of the scribble strip of the selected Channel, AuxIn, FxReturn, Bus, Matrix, Main Stereo, Mono      |
| Channel, AuxIn, FxReturn Send mute                             | Mutes or Unmutes the selected Channel, AuxIn, FxReturn to Bus or Main send                                         |
| Channel, AuxIn, FxReturn Send level                            | Sets the level of the selected Channel, AuxIn, FxReturn to Bus or Main send                                        |
| Bus, Main Send Stereo, Mono mute                               | Mutes or Unmutes the selected Bus or Main to Matrix send                                                           |
| Bus, Main Stereo, Mono Send level                              | Sets the level of the selected Bus or Main to Matrix send                                                          |
| Mute Group                                                     | Turns the selected mute group on or off                                                                            |
| Channel set trim                                               | Sets the trim of the selected channel                                                                              |
| Headamp set gain                                               | Sets the gain of the selected headamp                                                                              |
| Load Console Cue                                               | Loads the given cue from the consoles internal cue list 0-99                                                       |
| Load Console Scene                                             | Loads the given scene from the consoles internal scene list 0-99                                                   |
| Load Console Snippet                                           | Loads the given snippet from the consoles internal snippet list 0-99                                               |
| Tape Operation                                                 | Stop,Play,PlayPause,Record,RecordPause,Fast Forward,Rewind of the tape Deck                                        |
| Talkback Talk                                                  | Talkback talk on/off                                                                                               |
| Fader Control (Encoder)                                        | Adjusts a fader by a fixed step per encoder detent, designed for Stream Deck + and similar rotary controllers      |
| Fader State Display (feedback)                                 | Shows live fader level, mute state, and scribble-strip name on a button, updating in real time from the console    |

for additional actions please raise a feature request at [github](https://github.com/bitfocus/companion-module-behringer-x32)

If setting a fade duration, running another action for that value will cancel the first, and run the new one from the current level. If you wish to cancel a fade, run an 'Adjust fader level' with an offset of 0.

## Encoder Actions (Stream Deck + and similar)

### Fader Control (Encoder)

Designed for rotary encoders such as the Stream Deck +. Each detent moves a fader by a fixed step with no fade or easing — changes are sent to the console immediately for low-latency response.

**Setup:** Assign two instances of this action to the same encoder button — one with Direction = **Up (CW)** for clockwise rotation and one with Direction = **Down (CCW)** for counter-clockwise.

**Supported targets:** Channels 1–32, Aux Inputs 1–8, FX Returns 1-4, Buses 1–16, Matrix 1–6, Main L/R, Main M/C, DCAs 1–8.

| Option       | Description                             |
| ------------ | --------------------------------------- |
| Fader Target | The fader to control                    |
| Step Size    | How much to move per detent             |
| Direction    | Up (CW rotation) or Down (CCW rotation) |

## Feedbacks

### Fader State Display

An **advanced** feedback that renders live console state on a button. Unlike boolean feedbacks (which change the button style when a condition is true), this feedback actively composes text lines and sets the background colour on every update.

Each enabled field is shown as a separate line on the button, from top to bottom.

**Supported targets:** same as the encoder action — all fader types.

| Option                     | Description                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Fader Target               | The fader to monitor                                                                 |
| Show channel number / type | Top line: channel identifier, e.g. `Channel 1`, `MixBus 3`, `DCA 2`                  |
| Show scribble strip name   | The name set on the console's scribble strip. Hidden if no name is set.              |
| Show fader level in dB     | Current level formatted as `-12.5 dB`, `0.0 dB`, or `-∞` when the fader is fully off |
| Show mute state            | `MUTED` when the channel is muted, `LIVE` when active                                |
| Muted background color     | Button background colour when muted (default: red)                                   |
| Live background color      | Button background colour when active (default: black)                                |

The feedback subscribes to the fader level, mute state, and scribble strip name OSC paths simultaneously and updates in real time whenever any of them change on the console. No polling is required.
