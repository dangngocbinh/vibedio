export const fadingMaskStyle: React.CSSProperties = {
    // This is the core magic for the "transparent loang" (fade) effect.
    // In Vue, you would put this in the <style> section.
    // Logic:
    // - linear-gradient(to right, transparent, black 15%):
    //   Starts transparent at the left, becomes fully opaque (black) at 15% width.
    //   This creates the smooth fade-in from the left side.
    maskImage:
        'linear-gradient(to right, transparent 0%, black 20%, black 100%)',
    WebkitMaskImage:
        'linear-gradient(to right, transparent 0%, black 20%, black 100%)',
};
