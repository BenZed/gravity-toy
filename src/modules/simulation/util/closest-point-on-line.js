/******************************************************************************/
// Main
/******************************************************************************/

function closestPointOnLine (lineStart, lineEnd, point) {

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

/******************************************************************************/
// Export
/******************************************************************************/

export default closestPointOnLine

// Point d = closestpointonline(circle1.x, circle1.y,
//                 circle1.x + circle1.vx, circle1.y + circle1.vy, circle2.x, circle2.y);
// double closestdistsq = Math.pow(circle2.x - d.x, 2) + Math.pow(circle2.y - d.y), 2);
// if(closestdistsq <= Math.pow(circle1.radius + circle2.radius, 2){
//     // a collision has occurred
// }else{
//     // no collision has occurred
// }
