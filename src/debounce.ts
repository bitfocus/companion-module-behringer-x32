/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-this-alias */
import mimicFn = require('mimic-fn')

interface Options {
  /**
    Time to wait until the `input` function is called.
    @default 0
    */
  readonly wait?: number

  /**
    Maximum time to wait until the `input` function is called.
    Only applies when after is true.
    Disabled when 0
    @default 0
    */
  readonly maxWait?: number

  /**
    Trigger the function on the leading edge of the `wait` interval.
    For example, this can be useful for preventing accidental double-clicks on a "submit" button from firing a second time.
    @default false
    */
  readonly before?: boolean

  /**
    Trigger the function on the trailing edge of the `wait` interval.
    @default true
    */
  readonly after?: boolean
}

export interface BeforeOptions extends Options {
  readonly before: true
}

export interface NoBeforeNoAfterOptions extends Options {
  readonly after: false
  readonly before?: false
}

export interface DebouncedFunction<ArgumentsType extends unknown[], ReturnType> {
  (...args: ArgumentsType): ReturnType
  cancel(): void
}

export function debounceFn<ArgumentsType extends unknown[], ReturnType>(
  inputFunction: (...args: ArgumentsType) => ReturnType,
  options: BeforeOptions | NoBeforeNoAfterOptions | Options = {}
): DebouncedFunction<ArgumentsType, ReturnType | undefined> {
  if (typeof inputFunction !== 'function') {
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof inputFunction}\``)
  }

  const { wait = 0, maxWait = 0, before = false, after = true } = options

  if (!before && !after) {
    throw new Error("Both `before` and `after` are false, function wouldn't be called.")
  }

  let timeout: NodeJS.Timeout | undefined
  let maxTimeout: NodeJS.Timeout | undefined
  let result: ReturnType

  const debouncedFunction = function(...arguments_: ArgumentsType): ReturnType {
    // @ts-expect-error
    const context = this

    const later = (): void => {
      timeout = undefined

      if (maxTimeout) {
        clearTimeout(maxTimeout)
        maxTimeout = undefined
      }

      if (after) {
        result = inputFunction.apply(context, arguments_)
      }
    }

    const maxLater = (): void => {
      maxTimeout = undefined

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      result = inputFunction.apply(context, arguments_)
    }

    const shouldCallNow = before && !timeout
    clearTimeout(timeout!)
    timeout = setTimeout(later, wait)

    if (maxWait > 0 && !maxTimeout && after) {
      maxTimeout = setTimeout(maxLater, maxWait)
    }

    if (shouldCallNow) {
      result = inputFunction.apply(context, arguments_)
    }

    return result
  }

  mimicFn(debouncedFunction, inputFunction)

  debouncedFunction.cancel = (): void => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }

    if (maxTimeout) {
      clearTimeout(maxTimeout)
      maxTimeout = undefined
    }
  }

  return debouncedFunction
}
