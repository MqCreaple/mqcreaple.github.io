#import "@preview/cetz:0.5.2": canvas, draw

#set page(width: 12.6cm, height: 8.2cm, margin: 0pt, fill: none)
#set text(size: 10pt)

#align(center + horizon, canvas(length: 1cm, {
  import draw: *

  let add(a, b) = (a.at(0) + b.at(0), a.at(1) + b.at(1))
  let scale(a, s) = (a.at(0) * s, a.at(1) * s)

  let black = rgb("#111111")
  let guide = rgb("#777777")
  let thrust = rgb("#d62728")

  let origin = (0, 0)
  let centre = (3.5, 4.9)
  let a-theta = 28deg
  let half-length = 1.8
  let u = (-calc.sin(a-theta), calc.cos(a-theta))
  let n = (calc.cos(a-theta), calc.sin(a-theta))
  let tail = add(centre, scale(u, -half-length))
  let nose = add(centre, scale(u, half-length))

  // Inertial coordinate frame.
  line(origin, (7.0, 0), stroke: (paint: black, thickness: 0.9pt), mark: (end: ">"))
  line(origin, (0, 7.1), stroke: (paint: black, thickness: 0.9pt), mark: (end: ">"))

  // Position coordinates of the centre of mass.
  line((centre.at(0), 0), centre, stroke: (paint: guide, thickness: 0.55pt, dash: "dashed"))
  line((0, centre.at(1)), centre, stroke: (paint: guide, thickness: 0.55pt, dash: "dashed"))
  content((centre.at(0) + 0.08, -0.18), text(fill: black)[$x$])
  content((-0.22, centre.at(1) + 0.08), text(fill: black)[$y$])

  // The angle theta is measured counterclockwise from the upright direction.
  line(centre, add(centre, (0, 1.30)), stroke: (paint: black, thickness: 0.65pt, dash: "dashed"))
  arc(
    centre,
    start: 90deg,
    stop: 90deg + a-theta,
    radius: 0.78,
    anchor: "origin",
    stroke: black,
  )
  content(add(centre, (-0.18, 1.14)), text(fill: black)[$theta$])

  // Longitudinal reference line, including the extension used for phi.
  line(add(tail, scale(u, -1.15)), add(nose, scale(u, 0.18)), stroke: (paint: guide, thickness: 0.55pt, dash: "dashed"))

  // Black rocket body and fins.
  let tail-left = add(tail, scale(n, 0.20))
  let tail-right = add(tail, scale(n, -0.20))
  let shoulder-right = add(add(centre, scale(u, 0.80)), scale(n, -0.23))
  let shoulder-left = add(add(centre, scale(u, 0.80)), scale(n, 0.23))
  line(
    tail-left,
    tail-right,
    shoulder-right,
    nose,
    shoulder-left,
    close: true,
    stroke: black,
  )
  line(
    tail,
    add(add(tail, scale(u, -0.38)), scale(n, -0.53)),
    close: true,
    stroke: black,
  )
  line(
    tail,
    add(add(tail, scale(u, -0.38)), scale(n, 0.53)),
    close: true,
    stroke: black,
  )

  // Rocket length l.
  let dimension-offset = 0.90
  let dimension-start = add(tail, scale(n, dimension-offset))
  let dimension-end = add(nose, scale(n, dimension-offset))
  line(
    dimension-start,
    dimension-end,
    stroke: black,
    mark: (start: ">", end: ">"),
  )
  content(add(scale(add(dimension-start, dimension-end), 0.5), scale(n, 0.24)), text(fill: black)[$l$])

  // Mass and moment-of-inertia labels at the centre of mass.
  circle(centre, radius: 0.055, fill: black, stroke: none)
  line(centre, add(centre, (-0.42, -0.18)), stroke: black)
  content(add(centre, (-0.76, -0.28)), text(fill: black)[$m, I$])

  // Red thrust vector and its gimbal angle from the rocket's major axis.
  let a-phi = 22deg
  let thrust-direction = (
    -u.at(0) * calc.cos(a-phi) + u.at(1) * calc.sin(a-phi),
    -u.at(1) * calc.cos(a-phi) - u.at(0) * calc.sin(a-phi),
  )
  let thrust-end = add(tail, scale(thrust-direction, 2.05))
  line(
    tail,
    thrust-end,
    stroke: (paint: thrust, thickness: 1.35pt),
    mark: (end: (symbol: ">", fill: thrust, stroke: thrust)),
  )
  content(add(thrust-end, (0.22, 0.10)), text(fill: thrust)[$F$])

  let axis-angle = calc.atan2(-u.at(0), -u.at(1))
  let thrust-angle = calc.atan2(thrust-direction.at(0), thrust-direction.at(1))
  arc(
    tail,
    start: axis-angle,
    stop: thrust-angle,
    radius: 0.58,
    anchor: "origin",
    stroke: thrust,
  )
  content(add(tail, (0.66, -0.80)), text(fill: thrust)[$phi$])
}))

