import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="landing-feature-card p-6 rounded-xl">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-[#00E5A0]/10 rounded-full landing-accent-teal">
          {icon}
        </div>
        <h3 className="text-xl font-semibold landing-text-primary">{title}</h3>
        <p className="landing-text-body leading-relaxed">{description}</p>
      </div>
    </div>
  );
}