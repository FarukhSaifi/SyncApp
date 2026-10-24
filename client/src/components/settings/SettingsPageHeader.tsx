import type { SettingsPageHeaderProps } from "@types";

import { SETTINGS_LAYOUT } from "@constants/designTokens";

const SettingsPageHeader = ({ title, description }: SettingsPageHeaderProps) => {
  return (
    <header className={SETTINGS_LAYOUT.HEADER_CLASS}>
      <h1 className={SETTINGS_LAYOUT.TITLE_CLASS}>{title}</h1>
      <p className={SETTINGS_LAYOUT.DESCRIPTION_CLASS}>{description}</p>
    </header>
  );
};

export default SettingsPageHeader;
