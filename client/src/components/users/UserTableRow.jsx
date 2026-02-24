import React, { memo } from "react";
import { FiEdit3, FiShield, FiTrash2, FiUser, FiUserCheck } from "react-icons/fi";
import {
  COLOR_CLASSES,
  ROLE_CONFIG,
  SYNC_LABEL,
  USER_ROLES,
  USER_ROLE_OPTIONS,
  VERIFIED_CONFIG,
} from "../../constants";
import Button from "../ui/Button";
import { TableCell, TableRow } from "../ui/Table";

const UserTableRow = memo(({ user, formatDate, onEdit, onDelete }) => {
  const userId = user._id || user.id;
  const displayName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || SYNC_LABEL.N_A;
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
  const verifiedConfig = user.isVerified ? VERIFIED_CONFIG.verified : VERIFIED_CONFIG.unverified;
  const roleLabel = USER_ROLE_OPTIONS.find((opt) => opt.value === user.role)?.label ?? roleConfig.label;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
            <FiUser className="h-5 w-5 text-primary" />
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
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.className}`}
        >
          {user.role === USER_ROLES.ADMIN ? (
            <FiShield className="h-3 w-3 mr-1 shrink-0" />
          ) : (
            <FiUser className="h-3 w-3 mr-1 shrink-0" />
          )}
          {roleLabel}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${verifiedConfig.className}`}
        >
          {user.isVerified ? (
            <>
              <FiUserCheck className="h-3 w-3 mr-1 shrink-0" />
              {verifiedConfig.label}
            </>
          ) : (
            verifiedConfig.label
          )}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(user.lastLogin)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="flex items-center gap-1">
            <FiEdit3 className="h-4 w-4" />
            <span className="hidden sm:inline">{SYNC_LABEL.EDIT}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(userId, user.username)}
            className={`flex items-center gap-1 ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE} ${COLOR_CLASSES.HOVER_DESTRUCTIVE}`}
          >
            <FiTrash2 className="h-4 w-4" />
            <span className="hidden sm:inline">{SYNC_LABEL.DELETE}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = "UserTableRow";

export default UserTableRow;
