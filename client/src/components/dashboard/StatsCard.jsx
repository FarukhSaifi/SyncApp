import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

/**
 * Memoized stats card component
 */
const StatsCard = memo(({ title, value, icon: Icon, isActive, onClick }) => {
  return (
    <Card className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : ""}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {Icon && <Icon className="h-4 w-4 mr-2 text-muted-foreground" />}
        <CardTitle className="text-sm font-medium flex items-center space-x-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;
