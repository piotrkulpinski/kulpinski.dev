// The setup cover as flat-toned isometric shapes on a 326x163 grid (one unit = one dither cell).
const W = 326,
  H = 163
const C = 0.866,
  S = 0.5
const O = [109, 91]
const gray = d => {
  const v = Math.round(255 * (1 - d))
  return `rgb(${v},${v},${v})`
}
const p = ([x, y, z]) => [O[0] + (x - y) * C, O[1] + (x + y) * S - z]
const pts = list =>
  list
    .map(q =>
      p(q)
        .map(n => n.toFixed(2))
        .join(","),
    )
    .join(" ")
const poly = (list, d) =>
  `<polygon points="${pts(list)}" fill="${gray(d)}" stroke="#000" stroke-width="1" stroke-linejoin="round"/>`
// A flat rounded rectangle lying in the plane z, drawn through the isometric matrix.
const roundTop = (x, y, w, h, z, r, d) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" transform="matrix(${C} ${S} ${-C} ${S} ${O[0]} ${O[1] - z})" fill="${gray(d)}" stroke="#000" stroke-width="1.15"/>`

function box([x0, y0], [X, Y, Z], t) {
  const x1 = x0 + X,
    y1 = y0 + Y
  return [
    poly(
      [
        [x0, y1, 0],
        [x1, y1, 0],
        [x1, y1, Z],
        [x0, y1, Z],
      ],
      t.left,
    ),
    poly(
      [
        [x1, y0, 0],
        [x1, y1, 0],
        [x1, y1, Z],
        [x1, y0, Z],
      ],
      t.right,
    ),
    t.round
      ? ""
      : poly(
          [
            [x0, y0, Z],
            [x1, y0, Z],
            [x1, y1, Z],
            [x0, y1, Z],
          ],
          t.top,
        ),
  ].join("")
}
const shadow = (cx, cy, rx, ry) => {
  const [sx, sy] = p([cx, cy, 0])
  return `<ellipse cx="${sx}" cy="${sy}" rx="${rx}" ry="${ry}" fill="${gray(0.125)}"/>`
}

const out = []
out.push(shadow(20, 20, 50, 16))
out.push(shadow(94, -16, 56, 18))

// Cable along the iso x axis, from the server's right face into the back of the Mac mini.
const a = p([34, 6, 0]),
  b = p([72, 6, 0])
out.push(
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#000" stroke-width="2"/>`,
)

// Server tower with six drive bays and their lights.
out.push(box([0, 0], [34, 34, 84], { left: 0.69, right: 0.44, top: 0.19 }))
for (let i = 0; i < 6; i++) {
  const z0 = 9 + i * 12.6,
    z1 = z0 + 8.4
  out.push(
    poly(
      [
        [34, 5, z0],
        [34, 29, z0],
        [34, 29, z1],
        [34, 5, z1],
      ],
      1,
    ),
  )
  const [lx, ly] = p([34, 25, (z0 + z1) / 2])
  out.push(`<circle cx="${lx}" cy="${ly}" r="1.3" fill="#fff"/>`)
}

// Mac mini: thin box with a rounded top and a front light.
// The sides are the rounded outline stacked from the floor to the lid.
out.push(roundTop(70, -40, 46, 46, 0, 7, 0.44))
for (let z = 0.5; z < 11; z += 0.5) {
  out.push(roundTop(70, -40, 46, 46, z, 7, 0.44).replace('stroke="#000"', 'stroke="none"'))
}
out.push(roundTop(70, -40, 46, 46, 11, 7, 0.125))
const [mx, my] = p([116, -6, 5.5])
out.push(`<circle cx="${mx}" cy="${my}" r="1.6" fill="#000"/>`)

// Cloud above, to the right of the server.
out.push(
  `<path d="M169 44 h50 a10 10 0 0 0 0 -20 a13 13 0 0 0 -23 -8 a15 15 0 0 0 -27 8 a10 10 0 0 0 0 20 z" fill="${gray(0.25)}" stroke="#000" stroke-width="1"/>`,
)

console.log(
  `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>${out.join("")}</svg>`,
)
