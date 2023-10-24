import {NormalizedSequenceString} from './sequence'
import {macosSymbolPlaneKeys} from "./macos-symbol-plane"

const normalizedHotkeyBrand = Symbol('normalizedHotkey')

/**
 * A hotkey string with modifier keys in standard order. Build one with `eventToHotkeyString` or normalize a string via
 * `normalizeHotkey`.
 *
 * A full list of key names can be found here:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *
 * Examples:
 * "s"                  // Lowercase character for single letters
 * "S"                  // Uppercase character for shift plus a letter
 * "1"                  // Number character
 * "?"                  // Shift plus "/" symbol
 * "Enter"              // Enter key
 * "ArrowUp"            // Up arrow
 * "Control+s"          // Control modifier plus letter
 * "Control+Alt+Delete" // Multiple modifiers
 */
export type NormalizedHotkeyString = NormalizedSequenceString & {[normalizedHotkeyBrand]: true}

/**
 * Returns a hotkey character string for keydown and keyup events.
 * @example
 * document.addEventListener('keydown', function(event) {
 *   if (eventToHotkeyString(event) === 'h') ...
 * })
 */
export function eventToHotkeyString(event: KeyboardEvent, platform: string = navigator.platform): NormalizedHotkeyString {
  const {ctrlKey, altKey, metaKey, key} = event
  const hotkeyString: string[] = []
  const modifiers: boolean[] = [ctrlKey, altKey, metaKey, showShift(event)]

  for (const [i, mod] of modifiers.entries()) {
    if (mod) hotkeyString.push(modifierKeyNames[i])
  }

  if (!modifierKeyNames.includes(key)) {
    const nonOptionPlaneKey = matchApplePlatform.test(platform) ? macosSymbolPlaneKeys[key] ?? key : key
    hotkeyString.push(nonOptionPlaneKey)
  }

  return hotkeyString.join('+') as NormalizedHotkeyString
}

const modifierKeyNames: string[] = ['Control', 'Alt', 'Meta', 'Shift']

// We don't want to show `Shift` when `event.key` is capital
function showShift(event: KeyboardEvent): boolean {
  const {shiftKey, code, key} = event
  return shiftKey && !(code.startsWith('Key') && key.toUpperCase() === key)
}

/**
 * Normalizes a hotkey string before comparing it to the serialized event
 * string produced by `eventToHotkeyString`.
 * - Replaces the `Mod` modifier with `Meta` on mac, `Control` on other
 *   platforms.
 * - Ensures modifiers are sorted in a consistent order
 * @param hotkey a hotkey string
 * @param platform NOTE: this param is only intended to be used to mock `navigator.platform` in tests
 * @returns {string} normalized representation of the given hotkey string
 */
export function normalizeHotkey(hotkey: string, platform?: string | undefined): NormalizedHotkeyString {
  let result: string
  result = localizeMod(hotkey, platform)
  result = sortModifiers(result)
  return result as NormalizedHotkeyString
}

const matchApplePlatform = /Mac|iPod|iPhone|iPad/i

function localizeMod(hotkey: string, platform: string = navigator.platform): string {
  const localModifier = matchApplePlatform.test(platform) ? 'Meta' : 'Control'
  return hotkey.replace('Mod', localModifier)
}

function sortModifiers(hotkey: string): string {
  const key = hotkey.split('+').pop()
  const modifiers = []
  for (const modifier of ['Control', 'Alt', 'Meta', 'Shift']) {
    if (hotkey.includes(modifier)) {
      modifiers.push(modifier)
    }
  }
  modifiers.push(key)
  return modifiers.join('+')
}
