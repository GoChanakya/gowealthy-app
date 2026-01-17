import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export const isMobile = width <= breakpoints.mobile;
export const isTablet = width > breakpoints.mobile && width <= breakpoints.tablet;
export const isDesktop = width > breakpoints.desktop;

// DARK THEME Colors (from App.css)
export const colors = {
  // Background (DARK)
  backgroundColor: '#000000',
  cardBackground: '#000000',
  
  // Text
  textColor: '#ffffff',
  subtitleColor: '#9ca3af',
  
  // Accent Colors
  accentColor: '#6366f1',
  secondaryAccent: '#4f46e5',
  darkAccent: '#3730a3',
  
  // Orange
  primaryOrange: '#ff6300',
  secondaryOrange: '#e55a00',
  
  // Purple
  primaryPurple: '#6c50c4',
  secondaryPurple: '#8b5cf6',
  
  // Progress
  progressInactive: '#374151',
  progressActive: '#6366f1',
  
  // Options
  optionBackground: '#1f2937',
  optionBorder: '#374151',
  optionSelected: '#6c50c4',
  optionHover: '#6c50c4',
  
  // Button
  buttonDisabled: '#374151',
  
  // Gradients
  gradientPurple1: '#8b5cf6',
  gradientPurple2: '#6366f1',
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },
  lg: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 12,
  },
};

// GLOBAL STYLES (used across all screens)
export const globalStyles = StyleSheet.create({
  // Main background (pure black)
  backgroundContainer: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },
  
  // App container (black with rounded corners)
  appContainer: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: isMobile ? 16 : 24,
    padding: isMobile ? 16 : 24,
    paddingTop: isMobile ? 80 : 24,
    margin: 0,
  },
  
  // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: isMobile ? 24 : 40,
//     position: 'relative',
//     minHeight: 40,
//     width: '60%'
//   },

header: {
  flexDirection: 'column',  // CHANGE THIS
  alignItems: 'center',
  marginBottom: isMobile ? 24 : 40,
  position: 'relative',
  minHeight: 40,
  width: '100%',  // CHANGE THIS - full width to contain back button
},
  
//   backButton: {
//     backgroundColor: colors.optionBackground,
//     borderWidth: 1,
//     borderColor: colors.optionBorder,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//   },
backButton: {
  backgroundColor: colors.optionBackground,
  borderWidth: 1,
  borderColor: colors.optionBorder,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  alignSelf: 'flex-start',  // ADD THIS - keeps it on left
  marginBottom: 8,  // ADD THIS - space from title
},
  
  backButtonText: {
    color: colors.subtitleColor,
    fontSize: 14,
    fontWeight: '500',
  },
  
  logo: {
  alignItems: 'center',
  width: '100%',  // CHANGE THIS
},
  
  sectionTitle: {
    fontSize: isMobile ? 13 : 16,
    fontWeight: '600',
    color: colors.accentColor,
    textAlign: 'center',
  },
  
  // Progress Bar
// Progress Bar - Reduce size
progressContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: isMobile ? 32 : 40,
  alignSelf: 'center',
  width: '100%',
},

progressStepContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},

progressStep: {
  width: isMobile ? 10 : 16,  // REDUCED from 16 to 10 on mobile
  height: isMobile ? 10 : 16,  // REDUCED from 16 to 10 on mobile
  borderRadius: isMobile ? 5 : 8,  // ADJUST radius
  backgroundColor: colors.progressInactive,
  borderWidth: 2,  // REDUCED from 3 to 2
  borderColor: colors.backgroundColor,
},

progressStepActive: {
  backgroundColor: colors.progressActive,
  transform: [{ scale: isMobile ? 1.3 : 1.2 }],  // Slightly bigger scale on mobile
},

progressLine: {
  width: isMobile ? 50 : 60,  // REDUCED from 60 to 30 on mobile
  height: 2,  // REDUCED from 3 to 2
  backgroundColor: colors.progressInactive,
},
// progressContainer: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'center',
//   marginBottom: isMobile ? 32 : 40,
//   paddingHorizontal: 20,  // CHANGE from 10 to 20
//   width: '80%',  // ADD THIS
//   maxWidth: isMobile ? 350 : 500,  // ADD THIS - actual width limit
//   alignSelf: 'center',  // ADD THIS
// },
  
//   progressStepContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
  
//   progressStep: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: colors.progressInactive,
//     borderWidth: 3,
//     borderColor: colors.backgroundColor,
//   },
  
//   progressStepCompleted: {
//     backgroundColor: colors.progressActive,
//   },
  
//   progressStepActive: {
//     backgroundColor: colors.progressActive,
//     transform: [{ scale: 1.2 }],
//   },
  
//   progressLine: {
//     width: 60,
//     height: 3,
//     backgroundColor: colors.progressInactive,
//   },
  
  progressLineCompleted: {
    backgroundColor: colors.progressActive,
  },
  
  // Question Container
  questionContainer: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
    paddingHorizontal: isMobile ? 16 : 20,
  },
  
  questionText: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: '700',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: isMobile ? 32 : 48,
    maxWidth: 400,
  },
  
  questionSubtitle: {
    fontSize: isMobile ? 14 : 16,
    color: colors.subtitleColor,
    textAlign: 'center',
    marginBottom: 60,
  },
  
  // Confirm Button
  confirmButton: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: isMobile ? 32 : 40,
  },
  
  confirmButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  
  buttonInner: {
    paddingVertical: isMobile ? 14 : 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  confirmButtonText: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
  },
  
  // Input Label
  inputLabel: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  // Error Text
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
});

// Section 1 Specific Styles (from section1.css)
export const section1Styles = StyleSheet.create({
  combinedInputContainer: {
    width: '100%',
    maxWidth: 420,
    gap: isMobile ? 28 : 36,
  },
  
  ageInputSection: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  
  numberInputContainer: {
    width: '100%',
    maxWidth: isMobile ? 200 : 220,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    borderRadius: 12,
    backgroundColor: colors.optionBackground,
  },
  
  numberInput: {
    width: '100%',
    padding: isMobile ? 14 : 16,
    fontSize: isMobile ? 16 : 18,
    color: colors.textColor,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  genderSection: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  
  genderOptionsContainer: {
    flexDirection: 'row',
    gap: isMobile ? 16 : 20,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  
  genderOption: {
    flex: 1,
    maxWidth: isMobile ? 160 : 180,
    alignItems: 'center',
    paddingVertical: isMobile ? 20 : 24,
    paddingHorizontal: isMobile ? 12 : 16,
    borderRadius: 16,
    backgroundColor: colors.optionBackground,
    borderWidth: 2,
    borderColor: colors.optionBorder,
  },
  
  selectedGender: {
    backgroundColor: colors.optionSelected,
    borderColor: colors.accentColor,
    ...shadows.md,
  },
  
  genderImage: {
    width: isMobile ? 70 : 80,
    height: isMobile ? 70 : 80,
    marginBottom: isMobile ? 16 : 20,
  },
  
  genderLabel: {
    fontSize: isMobile ? 15 : 16,
    fontWeight: '500',
    color: colors.textColor,
  },
});