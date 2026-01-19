import React from 'react';
import { useRive } from '@rive-app/react-canvas';

const WhereYouStand = () => {
  const { RiveComponent } = useRive({
    src: '/animations/analytics_business_animation.riv',
    stateMachines: 'State Machine 1', 
    autoplay: true,
    onLoad: () => {
      console.log('Animation loaded with state machine');
    },
  });

  return (
    <div className="w-full h-full">
      <RiveComponent />
    </div>
  );
};

export default WhereYouStand;