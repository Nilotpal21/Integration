type AppIconId = 'hubspot' | 'salesforce' | 'zendesk' | 'calendly';

const APP_ICON_MAP: Record<AppIconId, { src: string; alt: string }> = {
  hubspot: { src: '/app-logos/hubspot.svg', alt: 'HubSpot' },
  salesforce: { src: '/app-logos/salesforce.svg', alt: 'Salesforce' },
  zendesk: { src: '/app-logos/zendesk.svg', alt: 'Zendesk' },
  calendly: { src: '/app-logos/calendly.svg', alt: 'Calendly' },
};

export function appNameToId(appName: string): AppIconId | null {
  const normalized = appName.trim().toLowerCase();
  if (normalized === 'hubspot') return 'hubspot';
  if (normalized === 'salesforce') return 'salesforce';
  if (normalized === 'zendesk') return 'zendesk';
  if (normalized === 'calendly') return 'calendly';
  return null;
}

export function AppIcon({
  appId,
  className = 'size-10',
}: {
  appId: AppIconId;
  className?: string;
}) {
  const asset = APP_ICON_MAP[appId];

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt={asset.alt} className="h-[72%] w-[72%] object-contain" />
    </div>
  );
}

