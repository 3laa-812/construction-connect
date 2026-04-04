export const Colors = {
  // Backgrounds
  ground:      '#0D0F0E',   // root background (deepest level)
  surface:     '#141716',   // card / sheet background
  surface2:    '#1C1F1D',   // elevated surface (modals, dropdowns)

  // Borders
  border:      '#2A2E2B',   // default border
  border2:     '#363B37',   // stronger border (active states)

  // Primary action — amber
  amber:       '#D4920A',   // primary CTA, focus rings, active tabs
  amberDim:    '#8A5F06',   // muted amber (hover state on dark)
  amberHover:  '#E0A020',   // button hover

  // Text
  text1:       '#F0EDE8',   // primary text (headings, labels)
  text2:       '#9A9890',   // secondary text (descriptions, meta)
  text3:       '#5C5A55',   // tertiary text (placeholders, disabled)

  // Semantic status (derive from above in app, but export base for JS access)
  success:     '#3A7D44',   
  successText: '#7EC893',
  warning:     '#8A5F06',   
  warningText: '#D4920A',
  error:       '#8B2E2E',   
  errorText:   '#F0A0A0',
  info:        '#2A4A6B',
  infoText:    '#7EB8E0',
};

export const Spacing = {
  xs: 4, 
  sm: 8, 
  md: 16, 
  lg: 24, 
  xl: 32, 
  xxl: 48,
};

export const Radius = {
  sm: 4,    
  md: 6,    
  lg: 8,    
  xl: 12,   
};

export const Duration = {
  fast: 120,   
  normal: 200, 
  slow: 300,   
};

export const Easing = {
  outExpo: [0.16, 1, 0.3, 1] as const,
};

export const Fonts = {
  display: 'DMSerifDisplay',     
  body:    'Geist',              
  mono:    'GeistMono',          
  arabic:  'NotoSansArabic',     
};
