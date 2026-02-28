// Background images for different pages
// Using the same style as yinlin.wiki - ink wash mountain landscape

const BG_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop',
  museum: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop',
  activity: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80&auto=format&fit=crop',
};

interface PageBackgroundProps {
  type?: 'default' | 'museum' | 'activity';
  children: React.ReactNode;
}

export default function PageBackground({ type = 'default', children }: PageBackgroundProps) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background gradient overlay - matching yinlin.wiki's light blue-white style */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: type === 'museum'
            ? 'linear-gradient(180deg, #c8dff0 0%, #ddeef8 40%, #e8f3f9 100%)'
            : 'linear-gradient(180deg, #d4e9f7 0%, #eff6fb 40%, #e8f3f9 100%)',
          zIndex: -2,
        }}
      />
      {/* Content */}
      {children}
    </div>
  );
}
