import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

/**
 * Memoized stats card component
 */
const StatsCard = memo(({ title, value, icon: Icon, isActive, onClick }) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;

