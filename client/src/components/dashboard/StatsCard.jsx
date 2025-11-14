import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

/**
 * Memoized stats card component with responsive sizing for mobile
 */
const StatsCard = memo(({ title, value, icon: Icon, isActive, onClick }) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : ""} ${
        onClick ? "" : "cursor-default"
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        {Icon && <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />}
        <CardTitle className="text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 truncate ml-1 sm:ml-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;
