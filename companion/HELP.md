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
| Channel dynamics (compressor)                                  | Turns channel 1-32 dynamics on, off, or toggles it                                                                 |
| Channel delay                                                  | Turns channel 1-32 delay on, off, or toggles it                                                                    |
| Channel delay time                                             | Sets or adjusts channel 1-32 delay from 0.3 to 500 ms in 0.1 ms steps                                              |
| Load Console Cue                                               | Loads the given cue from the consoles internal cue list 0-99                                                       |
| Load Console Scene                                             | Loads the given scene from the consoles internal scene list 0-99                                                   |
| Load Console Snippet                                           | Loads the given snippet from the consoles internal snippet list 0-99                                               |
| Tape Operation                                                 | Stop,Play,PlayPause,Record,RecordPause,Fast Forward,Rewind of the tape Deck                                        |
| Talkback Talk                                                  | Talkback talk on/off                                                                                               |

for additional actions please raise a feature request at [github](https://github.com/bitfocus/companion-module-behringer-x32)

If setting a fade duration, running another action for that value will cancel the first, and run the new one from the current level. If you wish to cancel a fade, run an 'Adjust fader level' with an offset of 0.

Channel dynamics and delay enabled feedbacks can show their current on/off state on buttons. Fader level variables and feedback comparisons use 0.1 dB precision.

To display the current channel delay time on a button, use `$(your_connection:delay_ch_01_ms) ms` for channel 1, up to `$(your_connection:delay_ch_32_ms) ms` for channel 32. Replace `your_connection` with the connection label in Companion. Values are read from the console and rounded to 0.1 ms.

The channel delay range is 0.3 to 500 ms in 0.1 ms steps. In **Adjust channel delay time**, choose an adjustment such as `1`, `-1`, `10`, or `-10` for buttons that increase or decrease the delay by that many milliseconds. To bypass the delay, use **Channel delay on/off**.
