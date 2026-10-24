import { memo } from "react";

import { DATA_TABLE, ROLE_CONFIG, SYNC_LABEL, USER_ROLES, USER_ROLE_OPTIONS, VERIFIED_CONFIG } from "@constants";
import type { UserTableRowProps } from "@types";
import { formatDateTime, formatLastLogin } from "@utils/dateUtils";
import { FiEdit3, FiShield, FiTrash2, FiUser, FiUserCheck } from "react-icons/fi";

import StatusPill from "@components/common/StatusPill";
import { TableCell, TableRow } from "@components/common/Table";
import Tooltip from "@components/common/Tooltip";

const UserTableRow = memo<UserTableRowProps>(({ user, onEdit, onDelete }) => {
  const userId = user._id || user.id || "";
  const displayName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || SYNC_LABEL.N_A;
  const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;
  const verifiedConfig = user.isVerified ? VERIFIED_CONFIG.verified : VERIFIED_CONFIG.unverified;
  const roleLabel = USER_ROLE_OPTIONS.find((opt) => opt.value === user.role)?.label ?? roleConfig.label;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <FiUser className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{displayName}</div>
            <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-[200px] truncate" title={user.email}>
        {user.email}
      </TableCell>
      <TableCell>
        <StatusPill label={roleLabel} className={roleConfig.className} size="SM">
          {user.role === USER_ROLES.ADMIN ? (
            <FiShield className="h-3 w-3 mr-1 shrink-0" />
          ) : (
            <FiUser className="h-3 w-3 mr-1 shrink-0" />
          )}
        </StatusPill>
      </TableCell>
      <TableCell>
        <StatusPill label={verifiedConfig.label} className={verifiedConfig.className} size="SM">
          {user.isVerified ? <FiUserCheck className="h-3 w-3 mr-1 shrink-0" /> : null}
        </StatusPill>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDateTime(user.createdAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDateTime(user.updatedAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {formatLastLogin(user.lastLogin)}
      </TableCell>
      <TableCell className={DATA_TABLE.ACTIONS_CELL}>
        <div className={DATA_TABLE.ACTIONS_WRAP}>
          <Tooltip content={SYNC_LABEL.EDIT} side="top">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className={DATA_TABLE.ACTION_BTN}
              aria-label={SYNC_LABEL.EDIT}
            >
              <FiEdit3 className={DATA_TABLE.ACTION_ICON} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content={SYNC_LABEL.DELETE} side="top">
            <button
              type="button"
              onClick={() => onDelete(userId, user.username)}
              className={DATA_TABLE.ACTION_BTN_DANGER}
              aria-label={SYNC_LABEL.DELETE}
            >
              <FiTrash2 className={DATA_TABLE.ACTION_ICON} aria-hidden />
            </button>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = "UserTableRow";

export default UserTableRow;
