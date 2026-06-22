type RobotStatePanelProps = {
  title: string;
  values: {
    label: string;
    value: number;
  }[];
};

export function RobotStatePanel({
  title,
  values,
}: RobotStatePanelProps) {

  const isJointPanel = values.some(v => v.label === 'J1');

  return (
    <section className="robot-state">
      <h2>{title}</h2>

      <div className={isJointPanel ? "robot-state-joints" : ""}>
        {values.map((item) => (
          <p key={item.label} className="robot-state-line">

            <span className="robot-state-label">
              {item.label}:
            </span>

            <span className="robot-state-value">
              {Math.abs(item.value) < 0.0005
                ? '0.000'
                : item.value.toFixed(3)}
            </span>

          </p>
        ))}
      </div>

    </section>
  );
}
