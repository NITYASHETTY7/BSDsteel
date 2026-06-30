import React from "react";

interface StackedPlateBarProps {
  quantity: number;
  maxQuantity?: number;
}

export function StackedPlateBar({ quantity, maxQuantity = 100 }: StackedPlateBarProps) {
  const percentage = Math.min((quantity / maxQuantity) * 100, 100);
  
  // Create ~20 thin segments total
  const totalSegments = 20; 
  const activeSegments = Math.ceil((percentage / 100) * totalSegments);

  return (
    <div className="flex items-center gap-[2px] w-full max-w-[120px] h-3 bg-background p-[2px] rounded-sm">
      {Array.from({ length: totalSegments }).map((_, i) => (
        <div 
          key={i} 
          className={`flex-1 h-full rounded-[1px] transition-colors ${i < activeSegments ? 'bg-[#3D7A6B]' : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}
