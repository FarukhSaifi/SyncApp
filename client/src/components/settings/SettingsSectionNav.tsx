"use client";

import type { SettingsSectionNavProps } from "@types";

import { SETTINGS_LAYOUT } from "@constants/designTokens";

const SettingsSectionNav = ({ items, activeId, onSelect, ariaLabel }: SettingsSectionNavProps) => {
  return (
    <nav className={SETTINGS_LAYOUT.SECTION_NAV_CLASS} aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            className={`${SETTINGS_LAYOUT.SECTION_NAV_ITEM_BASE} ${
              isActive ? SETTINGS_LAYOUT.SECTION_NAV_ITEM_ACTIVE : SETTINGS_LAYOUT.SECTION_NAV_ITEM_IDLE
            }`}
            onClick={() => {
              onSelect(item.id);
            }}
            aria-current={isActive ? "true" : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsSectionNav;
