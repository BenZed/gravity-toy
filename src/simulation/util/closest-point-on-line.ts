import { V2 } from '@benzed/math'

//// Main ////

function closestPointOnLine(lineStart: V2, lineEnd: V2, point: V2): V2 {
    const a = lineEnd.y - lineStart.y
    const b = lineStart.x - lineEnd.x

    const c1 = a * lineStart.x + b * lineStart.y
    const c2 = -b * point.x + a * point.y

    const det = a * a - -b * b

    const closest = point.copy()

    if (det !== 0) {
        closest.x = (a * c1 - b * c2) / det
        closest.y = (a * c2 - -b * c1) / det
    }

    return closest
}

//// Exports ////

export default closestPointOnLine

export { closestPointOnLine }
