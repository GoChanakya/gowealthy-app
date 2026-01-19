import React from 'react';
import { useRive } from '@rive-app/react-canvas';

const ActClarity = () => {
  const { RiveComponent } = useRive({
    src: '/animations/portfolio_hero_animation.riv',
    stateMachines: 'State Machine 1', // Try this - often handles looping automatically
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

export default ActClarity;