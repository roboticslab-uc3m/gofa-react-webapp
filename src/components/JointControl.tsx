import { AxisSlider } from './AxisSlider';
// import { RobotStatePanel } from './RobotStatePanel';
import { useTranslation } from 'react-i18next';

const jointLimitsDeg = [
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -225, max: 225 },
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -270, max: 270 },
];

const degToRad = (deg: number) => deg * Math.PI / 180;
const radToDeg = (rad: number) => rad * 180 / Math.PI;

type JointControlProps = {
  currentJoints: number[];
  referenceJoints: number[];
  targetJoints: number[];
  updateTargetJoint: (index: number, value: number) => void;
  moveRobotJoints: () => void;
  returnToReferenceJoints: () => void;
  captureCurrentJointsAsReference: () => void;
  moveRobotJointsDirect: (joints: number[]) => void;
  moveToHome: () => void;
};

export function JointControl({
  currentJoints,
  referenceJoints,
  targetJoints,
  updateTargetJoint,
  moveRobotJoints,
  returnToReferenceJoints,
  captureCurrentJointsAsReference,
  moveRobotJointsDirect,
}: JointControlProps) {
  const { t } = useTranslation();

  return (
    <section className="controls">
      <h2>{t('joint_control.title')}</h2>

      {/* <RobotStatePanel
        title="Referencia articular [°]"
        values={referenceJoints.map((joint, index) => ({
          label: `J${index + 1}`,
          value: radToDeg(joint),
        }))}
      /> */}

      {targetJoints.map((joint, index) => {
        const limits = jointLimitsDeg[index];

        return (
          <AxisSlider
            key={`joint-${index}`}
            label={`J${index + 1} (${limits.min}° / ${limits.max}°)`}
            value={radToDeg(joint)}
            reference={radToDeg(referenceJoints[index] ?? joint)}
            min={limits.min}
            max={limits.max}
            step={1}
            onChange={(value) => updateTargetJoint(index, degToRad(value))}
            // onStepMove={(newValue) => {updateTargetJoint(index, degToRad(newValue)); moveRobotJoints();}}
            onStepMove={(newValue) => {
              const updatedJoints = [...targetJoints];
              updatedJoints[index] = degToRad(newValue);

              updateTargetJoint(index, degToRad(newValue));
              moveRobotJointsDirect(updatedJoints);
            }}
            current={radToDeg(currentJoints[index] ?? joint)}
            showCurrent={true}
          />
        );
      })}

      <button onClick={moveRobotJoints}>{t('joint_control.send_button')}</button>
      <button onClick={returnToReferenceJoints}>{t('joint_control.return_button')}</button>
      <button onClick={captureCurrentJointsAsReference}>{t('joint_control.update_reference')}</button>

    </section>
  );
}
