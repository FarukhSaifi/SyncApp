import React, { memo } from "react";
import { FiEdit3, FiShield, FiTrash2, FiUser, FiUserCheck } from "react-icons/fi";
import { COLOR_CLASSES, SYNC_LABEL, USER_ROLES, USER_ROLE_OPTIONS } from "../../constants";
import Button from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

/**
 * Mobile-friendly user card component
 */
const UserCard = memo(({ user, onEdit, onDelete, formatDate }) => {
  const userId = user._id || user.id;
  const userDisplayName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "N/A";

  return (
    <Card className="border">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
                <FiUser className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{userDisplayName}</h3>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Role and Status */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                user.role === USER_ROLES.ADMIN ? "bg-purple-100 text-purple-800" : "bg-muted text-muted-foreground"
              }`}
            >
              {user.role === USER_ROLES.ADMIN ? (
                <>
                  <FiShield className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
                  <span className="truncate">
                    {USER_ROLE_OPTIONS.find((opt) => opt.value === USER_ROLES.ADMIN)?.label}
                  </span>
                </>
              ) : (
                <>
                  <FiUser className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
                  <span className="truncate">
                    {USER_ROLE_OPTIONS.find((opt) => opt.value === USER_ROLES.USER)?.label}
                  </span>
                </>
              )}
            </span>
            <span
              className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                user.isVerified ? COLOR_CLASSES.BADGE.VERIFIED : COLOR_CLASSES.BADGE.UNVERIFIED
              }`}
            >
              {user.isVerified ? (
                <>
                  <FiUserCheck className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
                  <span className="truncate">{SYNC_LABEL.VERIFIED}</span>
                </>
              ) : (
                <span className="truncate">{SYNC_LABEL.UNVERIFIED}</span>
              )}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{SYNC_LABEL.TABLE_JOINED}</div>
              <div className="text-foreground truncate">{formatDate(user.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{SYNC_LABEL.TABLE_LAST_LOGIN}</div>
              <div className="text-foreground truncate">{formatDate(user.lastLogin)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="flex-1 min-w-0">
              <FiEdit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{SYNC_LABEL.EDIT}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(userId, user.username)}
              className={`flex-1 min-w-0 ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE} ${COLOR_CLASSES.HOVER_DESTRUCTIVE}`}
            >
              <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{SYNC_LABEL.DELETE}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

UserCard.displayName = "UserCard";

export default UserCard;
