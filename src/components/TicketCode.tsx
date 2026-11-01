/** Illustrativer Ticket-Code (kein echter QR-Code) – wird aus dem Buchungscode erzeugt */
export function TicketCode({ code, size = 132 }: { code: string; size?: number }) {
  const n = 21;
  let seed = 0;
  for (const c of code) seed = (seed * 131 + c.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cells: JSX.Element[] = [];
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (rand() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }
  const eye = (x: number, y: number) => (
    <g key={`e${x}${y}`}>
      <rect x={x} y={y} width={7} height={7} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} />
    </g>
  );
  return (
    <svg className="ticket-code" viewBox={`-1 -1 ${n + 2} ${n + 2}`} width={size} height={size} role="img" aria-label={`Ticket ${code}`}>
      <rect x={-1} y={-1} width={n + 2} height={n + 2} fill="#fff" />
      <g fill="#0b0b14">
        {cells}
        {eye(0, 0)}
        {eye(n - 7, 0)}
        {eye(0, n - 7)}
      </g>
    </svg>
  );
}
