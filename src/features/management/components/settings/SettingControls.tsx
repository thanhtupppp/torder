import type { ChangeEvent } from "react";

type SettingToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="settings-screen__row">
      <div className="settings-screen__row-info">
        <h4>{label}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="settings-screen__row-action">
        <label className="settings-screen__switch" aria-label={label}>
          <input type="checkbox" checked={checked} onChange={onChange} />
          <span className="settings-screen__switch-track"></span>
        </label>
      </div>
    </div>
  );
}

type SettingActionProps = {
  label: string;
  description?: string;
  buttonText: string;
  onClick: () => void;
};

export function SettingAction({
  label,
  description,
  buttonText,
  onClick,
}: SettingActionProps) {
  return (
    <div className="settings-screen__row">
      <div className="settings-screen__row-info">
        <h4>{label}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="settings-screen__row-action">
        <button type="button" className="btn border" onClick={onClick}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}
