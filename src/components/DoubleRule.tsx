/** Paire de filets épais / fin. */
export function DoubleRule({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={style} aria-hidden>
      <div className="rule-thick" />
      <div className="rule-thin" />
    </div>
  );
}
