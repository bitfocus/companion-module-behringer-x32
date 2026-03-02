import type { ExpressionOrValue } from '@companion-module/base'
import type { JsonValue } from 'type-fest'

export function exprVal<T extends JsonValue | undefined>(val: T): ExpressionOrValue<T> {
	return {
		isExpression: false,
		value: val,
	}
}

// /**
//  *
//  * Note: this is not guaranteed to work, especially if the expression is multi-line
//  */
// export function concatValues(
//     valA: ExpressionOrValue<JsonValue|undefined>,
//     valB: ExpressionOrValue<JsonValue|undefined>
// ): ExpressionOrValue<string> {
//     if (valA.isExpression || valB.isExpression) {
//         const exprA = valA.isExpression ? `(${valA.value})` : JSON.stringify(valA.value)
//         const exprB = valB.isExpression ? `(${valB.value})` : JSON.stringify(valB.value)
//         return {
//             isExpression: true,
//             value: `// hopefully this works!\nconcat(${exprA},${exprB})`,
//         }
//     } else {
//         return exprVal(`${valA.value ?? ''}${valB.value ?? ''}`)
//     }
// )
