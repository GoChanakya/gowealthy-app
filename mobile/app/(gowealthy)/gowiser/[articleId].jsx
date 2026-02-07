// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
//   StatusBar,
//   StyleSheet,
//   Animated,
//   Image,
//   ScrollView,
//   Linking,
//   TouchableWithoutFeedback
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
// import { db } from '../../../firebase-config';
// import { colors } from '../../../src/theme/globalStyles';

// const { width, height } = Dimensions.get('window');
// const ORANGE = '#FF6300';

// const ArticleStoryView = () => {
//   const router = useRouter();
//   const { articleId } = useLocalSearchParams();
//   const [article, setArticle] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [slides, setSlides] = useState([]);
//   const [hasAwardedXP, setHasAwardedXP] = useState(false);
//   const [showXPAnimation, setShowXPAnimation] = useState(false);
//   const [expandedFAQ, setExpandedFAQ] = useState(null);
//   const xpScale = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     fetchArticle();
//   }, [articleId]);

//   const fetchArticle = async () => {
//     try {
//       const articleRef = doc(db, 'products', 'gowiser', 'articles', articleId);
//       const articleSnap = await getDoc(articleRef);
      
//       if (articleSnap.exists()) {
//         const articleData = { id: articleSnap.id, ...articleSnap.data() };
//         setArticle(articleData);
        
//         await updateDoc(articleRef, {
//           views: increment(1)
//         });

//         createSlides(articleData);
//       }
//     } catch (error) {
//       console.error('Error fetching article:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createSlides = (articleData) => {
//     const slidesList = [];

//     slidesList.push({
//       type: 'intro',
//       content: {
//         title: articleData.title,
//         description: articleData.description,
//         image: articleData.titleImage,
//         author: articleData.author?.name || 'Admin',
//         minRead: articleData.minRead,
//         category: articleData.category
//       }
//     });

//     const sections = extractSections(articleData.body);
    
//     if (sections.length > 0) {
//       sections.forEach((section) => {
//         slidesList.push({
//           type: 'content',
//           content: section
//         });
//       });
//     } else {
//       const bodyContent = cleanHtmlContent(articleData.body);
//       const paragraphs = bodyContent.split('\n\n').filter(p => p.trim().length > 0);
//       const chunkSize = 3;
//       for (let i = 0; i < paragraphs.length; i += chunkSize) {
//         slidesList.push({
//           type: 'content',
//           content: {
//             title: '',
//             parts: paragraphs.slice(i, i + chunkSize).map(p => ({ text: p, normal: true }))
//           }
//         });
//       }
//     }

//     if (articleData.socialMediaPosts && articleData.socialMediaPosts.length > 0) {
//       slidesList.push({
//         type: 'social',
//         content: articleData.socialMediaPosts
//       });
//     }

//     if (articleData.faqHtml) {
//       const faqs = extractFAQs(articleData.faqHtml);
//       if (faqs.length > 0) {
//         slidesList.push({
//           type: 'faq',
//           content: faqs
//         });
//       }
//     }

//     slidesList.push({
//       type: 'end',
//       content: {
//         xp: articleData.xp,
//         tags: articleData.tags || []
//       }
//     });

//     setSlides(slidesList);
//   };

//   const cleanHtmlContent = (html) => {
//     if (!html) return '';
    
//     let text = html;
    
//     text = text.replace(/<li[^>]*>/gi, '\n• ');
//     text = text.replace(/<\/li>/gi, '');
//     text = text.replace(/<\/p>/gi, '\n\n');
//     text = text.replace(/<p[^>]*>/gi, '');
//     text = text.replace(/<h3[^>]*>/gi, '\n\n');
//     text = text.replace(/<\/h3>/gi, '\n');
//     text = text.replace(/<br\s*\/?>/gi, '\n');
//     text = text.replace(/<[^>]*>/g, '');
//     text = text.replace(/&nbsp;/g, ' ');
//     text = text.replace(/&amp;/g, '&');
//     text = text.replace(/&lt;/g, '<');
//     text = text.replace(/&gt;/g, '>');
//     text = text.replace(/&quot;/g, '"');
//     text = text.replace(/&#39;/g, "'");
//     text = text.replace(/  +/g, ' ');
//     text = text.replace(/\n\n\n+/g, '\n\n');
    
//     return text.trim();
//   };

//   const extractSections = (html) => {
//     const sections = [];
//     const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    
//     let matches = [...html.matchAll(h2Regex)];
    
//     matches.forEach((match, index) => {
//       const title = cleanHtmlContent(match[1]);
//       const startIndex = match.index + match[0].length;
//       const endIndex = matches[index + 1]?.index || html.length;
//       const content = html.substring(startIndex, endIndex);
//       const parts = parseContentWithFormatting(content);
      
//       sections.push({
//         title: title,
//         parts: parts
//       });
//     });

//     return sections;
//   };

//   const parseContentWithFormatting = (html) => {
//     const parts = [];
//     let tempHtml = html;
    
//     tempHtml = tempHtml.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
//       const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
//       if (items) {
//         return '\n' + items.map(item => 
//           '• ' + item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
//         ).join('\n') + '\n';
//       }
//       return match;
//     });
    
//     tempHtml = tempHtml.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
//       const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
//       if (items) {
//         return '\n' + items.map((item, idx) => 
//           `${idx + 1}. ` + item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
//         ).join('\n') + '\n';
//       }
//       return match;
//     });
    
//     const segments = tempHtml.split(/(<(?:strong|b|em|i|h3)[^>]*>.*?<\/(?:strong|b|em|i|h3)>)/gi);
    
//     segments.forEach(segment => {
//       if (!segment.trim()) return;
      
//       if (/<(strong|b)>(.*?)<\/(strong|b)>/i.test(segment)) {
//         const text = cleanHtmlContent(segment);
//         if (text) parts.push({ text, bold: true });
//       } else if (/<(em|i)>(.*?)<\/(em|i)>/i.test(segment)) {
//         const text = cleanHtmlContent(segment);
//         if (text) parts.push({ text, italic: true });
//       } else if (/<h3>(.*?)<\/h3>/i.test(segment)) {
//         const text = cleanHtmlContent(segment);
//         if (text) parts.push({ text, heading: true });
//       } else {
//         const text = cleanHtmlContent(segment);
//         if (text) parts.push({ text, normal: true });
//       }
//     });
    
//     return parts;
//   };

//   const extractFAQs = (faqHtml) => {
//     const faqs = [];
//     const h3Regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gi;
    
//     let matches = [...faqHtml.matchAll(h3Regex)];
    
//     matches.forEach((match) => {
//       faqs.push({
//         question: cleanHtmlContent(match[1]),
//         answer: cleanHtmlContent(match[2])
//       });
//     });

//     return faqs;
//   };

//   const getYouTubeVideoId = (url) => {
//     const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
//     const match = url.match(regex);
//     return match ? match[1] : null;
//   };

//   const handleScreenTap = (event) => {
//     const { locationX } = event.nativeEvent;
//     const tapZone = width / 3;

//     if (locationX < tapZone && currentSlide > 0) {
//       setCurrentSlide(prev => prev - 1);
//     } else if (locationX > tapZone * 2 && currentSlide < slides.length - 1) {
//       setCurrentSlide(prev => prev + 1);
      
//       if (currentSlide === slides.length - 2 && !hasAwardedXP) {
//         awardXP();
//       }
//     }
//   };

//   const awardXP = async () => {
//     setHasAwardedXP(true);
//     setShowXPAnimation(true);
    
//     Animated.sequence([
//       Animated.spring(xpScale, {
//         toValue: 1,
//         friction: 4,
//         tension: 40,
//         useNativeDriver: true,
//       }),
//       Animated.delay(2000),
//       Animated.timing(xpScale, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setShowXPAnimation(false);
//     });
//   };

//   const renderFormattedContent = (parts) => {
//     return parts.map((part, index) => {
//       if (part.bold) {
//         return <Text key={index} style={styles.boldText}>{part.text}</Text>;
//       } else if (part.italic) {
//         return <Text key={index} style={styles.italicText}>{part.text}</Text>;
//       } else if (part.heading) {
//         return <Text key={index} style={styles.h3Text}>{'\n'}{part.text}{'\n'}</Text>;
//       } else {
//         return <Text key={index}>{part.text}</Text>;
//       }
//     });
//   };

//   const renderSlide = (slide, index) => {
//     switch (slide.type) {
//       case 'intro':
//         return (
//           <View style={styles.slideContainer}>
//             {slide.content.image && (
//               <Image
//                 source={{ uri: slide.content.image }}
//                 style={styles.introImage}
//                 resizeMode="cover"
//               />
//             )}
//             <View style={styles.introOverlay}>
//               {slide.content.category && (
//                 <View style={styles.categoryBadgeWrapper}>
//                   <Text style={styles.categoryBadge}>{slide.content.category}</Text>
//                 </View>
//               )}
//               <Text style={styles.introTitle}>{slide.content.title}</Text>
//               <Text style={styles.introDescription}>{slide.content.description}</Text>
//               <View style={styles.introMeta}>
//                 <Text style={styles.metaText}>By {slide.content.author}</Text>
//                 <Text style={styles.metaText}>•</Text>
//                 <Text style={styles.metaText}>{slide.content.minRead} min read</Text>
//               </View>
//             </View>
//           </View>
//         );

//       case 'content':
//         return (
//           <View style={styles.slideContainer}>
//             <ScrollView 
//               style={styles.contentScroll}
//               contentContainerStyle={styles.contentScrollInner}
//               showsVerticalScrollIndicator={false}
//             >
//               {slide.content.title && (
//                 <Text style={styles.contentTitle}>{slide.content.title}</Text>
//               )}
//               <Text style={styles.contentText}>
//                 {renderFormattedContent(slide.content.parts)}
//               </Text>
//             </ScrollView>
            
//             <View style={styles.navButtons}>
//               {currentSlide > 0 && (
//                 <TouchableOpacity
//                   style={styles.navButtonLeft}
//                   onPress={() => setCurrentSlide(prev => prev - 1)}
//                 >
//                   <Text style={styles.navButtonText}>←</Text>
//                 </TouchableOpacity>
//               )}
//               {currentSlide < slides.length - 1 && (
//                 <TouchableOpacity
//                   style={styles.navButtonRight}
//                   onPress={() => {
//                     setCurrentSlide(prev => prev + 1);
//                     if (currentSlide === slides.length - 2 && !hasAwardedXP) {
//                       awardXP();
//                     }
//                   }}
//                 >
//                   <Text style={styles.navButtonText}>→</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         );

//       case 'social':
//         return (
//           <View style={styles.slideContainer}>
//             <ScrollView 
//               style={styles.contentScroll}
//               contentContainerStyle={styles.contentScrollInner}
//               showsVerticalScrollIndicator={false}
//             >
//               <Text style={styles.sectionTitle}>Related Content</Text>
//               <View style={styles.socialContainer}>
//                 {slide.content.map((post, idx) => {
//                   const videoId = post.platform === 'youtube' ? getYouTubeVideoId(post.url) : null;
                  
//                   return (
//                     <View key={idx} style={styles.socialCard}>
//                       {videoId ? (
//                         <TouchableOpacity
//                           style={styles.youtubePreview}
//                           onPress={() => Linking.openURL(post.url)}
//                           activeOpacity={0.8}
//                         >
//                           <Image
//                             source={{ uri: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }}
//                             style={styles.youtubeThumbnail}
//                             resizeMode="cover"
//                           />
//                           <View style={styles.playButton}>
//                             <Text style={styles.playIcon}>▶</Text>
//                           </View>
//                           <View style={styles.youtubeBadge}>
//                             <Text style={styles.youtubeBadgeText}>YouTube</Text>
//                           </View>
//                         </TouchableOpacity>
//                       ) : (
//                         <TouchableOpacity
//                           style={styles.socialLink}
//                           onPress={() => Linking.openURL(post.url)}
//                           activeOpacity={0.7}
//                         >
//                           <View style={styles.socialIcon}>
//                             <Text style={styles.socialEmoji}>
//                               {post.platform === 'instagram' ? '📸' :
//                                post.platform === 'twitter' ? '🐦' : '💼'}
//                             </Text>
//                           </View>
//                           <View style={styles.socialContent}>
//                             <Text style={styles.socialPlatform}>{post.platform}</Text>
//                             <Text style={styles.socialUrl} numberOfLines={1}>Tap to open</Text>
//                           </View>
//                           <Text style={styles.socialArrow}>→</Text>
//                         </TouchableOpacity>
//                       )}
//                     </View>
//                   );
//                 })}
//               </View>
//             </ScrollView>

//             <View style={styles.navButtons}>
//               {currentSlide > 0 && (
//                 <TouchableOpacity
//                   style={styles.navButtonLeft}
//                   onPress={() => setCurrentSlide(prev => prev - 1)}
//                 >
//                   <Text style={styles.navButtonText}>←</Text>
//                 </TouchableOpacity>
//               )}
//               {currentSlide < slides.length - 1 && (
//                 <TouchableOpacity
//                   style={styles.navButtonRight}
//                   onPress={() => {
//                     setCurrentSlide(prev => prev + 1);
//                     if (currentSlide === slides.length - 2 && !hasAwardedXP) {
//                       awardXP();
//                     }
//                   }}
//                 >
//                   <Text style={styles.navButtonText}>→</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         );

//       case 'faq':
//         return (
//           <View style={styles.slideContainer}>
//             <ScrollView 
//               style={styles.contentScroll}
//               contentContainerStyle={styles.contentScrollInner}
//               showsVerticalScrollIndicator={false}
//             >
//               <Text style={styles.faqMainTitle}>Frequently Asked Questions</Text>
//               <Text style={styles.faqSubtitle}>Everything you need to know</Text>
              
//               <View style={styles.faqContainer}>
//                 {slide.content.map((faq, idx) => (
//                   <View key={idx} style={styles.faqItem}>
//                     <TouchableOpacity
//                       style={styles.faqHeader}
//                       onPress={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
//                       activeOpacity={0.7}
//                     >
//                       <View style={styles.faqNumber}>
//                         <Text style={styles.faqNumberText}>{idx + 1}</Text>
//                       </View>
//                       <Text style={styles.faqQuestion}>{faq.question}</Text>
//                       <Text style={styles.faqToggle}>
//                         {expandedFAQ === idx ? '−' : '+'}
//                       </Text>
//                     </TouchableOpacity>
                    
//                     {expandedFAQ === idx && (
//                       <View style={styles.faqAnswerContainer}>
//                         <Text style={styles.faqAnswer}>{faq.answer}</Text>
//                       </View>
//                     )}
//                   </View>
//                 ))}
//               </View>
//             </ScrollView>

//             <View style={styles.navButtons}>
//               {currentSlide > 0 && (
//                 <TouchableOpacity
//                   style={styles.navButtonLeft}
//                   onPress={() => setCurrentSlide(prev => prev - 1)}
//                 >
//                   <Text style={styles.navButtonText}>←</Text>
//                 </TouchableOpacity>
//               )}
//               {currentSlide < slides.length - 1 && (
//                 <TouchableOpacity
//                   style={styles.navButtonRight}
//                   onPress={() => {
//                     setCurrentSlide(prev => prev + 1);
//                     if (currentSlide === slides.length - 2 && !hasAwardedXP) {
//                       awardXP();
//                     }
//                   }}
//                 >
//                   <Text style={styles.navButtonText}>→</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         );

//       case 'end':
//         return (
//           <View style={styles.slideContainer}>
//             <View style={styles.endContent}>
//               <Text style={styles.endEmoji}>🎉</Text>
//               <Text style={styles.endTitle}>Article Complete!</Text>
//               <Text style={styles.endSubtitle}>You've earned {slide.content.xp} XP</Text>
              
//               {slide.content.tags.length > 0 && (
//                 <View style={styles.tagsContainer}>
//                   {slide.content.tags.map((tag, idx) => (
//                     <View key={idx} style={styles.tag}>
//                       <Text style={styles.tagText}>#{tag}</Text>
//                     </View>
//                   ))}
//                 </View>
//               )}

//               <TouchableOpacity
//                 style={styles.doneButton}
//                 onPress={() => router.back()}
//               >
//                 <Text style={styles.doneButtonText}>Back to Articles</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         );

//       default:
//         return null;
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={ORANGE} />
//         <Text style={styles.loadingText}>Loading article...</Text>
//       </View>
//     );
//   }

//   if (!article || slides.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.errorText}>Article not found</Text>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
//           <Text style={styles.backButtonTextError}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const currentSlideData = slides[currentSlide];
//   const isTappableSlide = currentSlideData && ['intro', 'end'].includes(currentSlideData.type);

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
      
//       <View style={styles.container}>
//         <View style={styles.topBar}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//             <Text style={styles.closeButtonText}>✕</Text>
//           </TouchableOpacity>
          
//           <View style={styles.progressBars}>
//             {slides.map((_, index) => (
//               <View
//                 key={index}
//                 style={[
//                   styles.progressBarSegment,
//                   index <= currentSlide && styles.progressBarSegmentActive
//                 ]}
//               />
//             ))}
//           </View>
          
//           <View style={styles.xpBadgeTop}>
//             <Text style={styles.xpBadgeText}>🎯 {article.xp} XP</Text>
//           </View>
//         </View>

//         {isTappableSlide ? (
//           <TouchableWithoutFeedback onPress={handleScreenTap}>
//             <View style={{ flex: 1 }}>
//               {renderSlide(currentSlideData, currentSlide)}
//             </View>
//           </TouchableWithoutFeedback>
//         ) : (
//           renderSlide(currentSlideData, currentSlide)
//         )}

//         <View style={styles.slideCounter}>
//           <Text style={styles.slideCounterText}>
//             {currentSlide + 1} / {slides.length}
//           </Text>
//         </View>

//         {showXPAnimation && (
//           <Animated.View
//             style={[
//               styles.xpAnimationContainer,
//               {
//                 transform: [{ scale: xpScale }],
//                 opacity: xpScale,
//               },
//             ]}
//           >
//             <View style={styles.xpAnimationBadge}>
//               <Text style={styles.xpAnimationEmoji}>🎉</Text>
//               <Text style={styles.xpAnimationTitle}>+{article.xp} XP</Text>
//               <Text style={styles.xpAnimationSubtitle}>Keep learning!</Text>
//             </View>
//           </Animated.View>
//         )}
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.backgroundColor,
//   },

//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.backgroundColor,
//   },

//   loadingText: {
//     color: colors.textColor,
//     marginTop: 16,
//     fontSize: 16,
//   },

//   errorText: {
//     color: colors.textColor,
//     fontSize: 18,
//     marginBottom: 20,
//   },

//   backButtonError: {
//     backgroundColor: ORANGE,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },

//   backButtonTextError: {
//     color: colors.textColor,
//     fontWeight: '600',
//   },

//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingTop: 50,
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//   },

//   closeButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   closeButtonText: {
//     color: colors.textColor,
//     fontSize: 18,
//     fontWeight: '600',
//   },

//   progressBars: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 4,
//     marginHorizontal: 12,
//   },

//   progressBarSegment: {
//     flex: 1,
//     height: 3,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 2,
//   },

//   progressBarSegmentActive: {
//     backgroundColor: ORANGE,
//   },

//   xpBadgeTop: {
//     backgroundColor: ORANGE,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },

//   xpBadgeText: {
//     color: colors.textColor,
//     fontSize: 11,
//     fontWeight: '700',
//   },

//   slideContainer: {
//     flex: 1,
//     paddingTop: 100,
//   },

//   introImage: {
//     width: width,
//     height: height * 0.45,
//     position: 'absolute',
//     top: 100,
//   },

//   introOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     padding: 24,
//     justifyContent: 'flex-end',
//     paddingTop: height * 0.45 + 100,
//     paddingBottom: 40,
//   },

//   categoryBadgeWrapper: {
//     alignSelf: 'flex-start',
//     marginBottom: 12,
//   },

//   categoryBadge: {
//     fontSize: 11,
//     color: ORANGE,
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },

//   introTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: colors.textColor,
//     marginBottom: 12,
//     lineHeight: 34,
//   },

//   introDescription: {
//     fontSize: 15,
//     color: colors.textColor,
//     lineHeight: 22,
//     marginBottom: 12,
//   },

//   introMeta: {
//     flexDirection: 'row',
//     gap: 8,
//   },

//   metaText: {
//     fontSize: 12,
//     color: colors.textColor,
//     opacity: 0.8,
//   },

//   contentScroll: {
//     flex: 1,
//   },

//   contentScrollInner: {
//     padding: 24,
//     paddingBottom: 120,
//   },

//   contentTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: colors.textColor,
//     lineHeight: 32,
//     marginBottom: 20,
//   },

//   contentText: {
//     fontSize: 16,
//     color: colors.textColor,
//     lineHeight: 26,
//   },

//   boldText: {
//     fontWeight: '700',
//     color: ORANGE,
//   },

//   italicText: {
//     fontStyle: 'italic',
//   },

//   h3Text: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: ORANGE,
//   },

//   navButtons: {
//     position: 'absolute',
//     bottom: 80,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },

//   navButtonLeft: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255, 99, 0, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   navButtonRight: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255, 99, 0, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   navButtonText: {
//     color: colors.textColor,
//     fontSize: 24,
//     fontWeight: '600',
//   },

//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: colors.textColor,
//     marginBottom: 20,
//   },

//   socialContainer: {
//     gap: 16,
//   },

//   socialCard: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     backgroundColor: colors.cardBackground,
//   },

//   youtubePreview: {
//     position: 'relative',
//     width: '100%',
//     height: 200,
//   },

//   youtubeThumbnail: {
//     width: '100%',
//     height: '100%',
//   },

//   playButton: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -30 }, { translateY: -30 }],
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255, 99, 0, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   playIcon: {
//     fontSize: 24,
//     color: colors.textColor,
//     marginLeft: 4,
//   },

//   youtubeBadge: {
//     position: 'absolute',
//     bottom: 12,
//     right: 12,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },

//   youtubeBadgeText: {
//     color: colors.textColor,
//     fontSize: 11,
//     fontWeight: '600',
//   },

//   socialLink: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },

//   socialIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: colors.optionBackground,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },

//   socialEmoji: {
//     fontSize: 24,
//   },

//   socialContent: {
//     flex: 1,
//   },

//   socialPlatform: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.textColor,
//     textTransform: 'capitalize',
//     marginBottom: 4,
//   },

//   socialUrl: {
//     fontSize: 12,
//     color: colors.subtitleColor,
//   },

//   socialArrow: {
//     fontSize: 20,
//     color: ORANGE,
//   },

//   faqMainTitle: {
//     fontSize: 26,
//     fontWeight: '700',
//     color: colors.textColor,
//     marginBottom: 8,
//     textAlign: 'center',
//   },

//   faqSubtitle: {
//     fontSize: 14,
//     color: colors.subtitleColor,
//     marginBottom: 24,
//     textAlign: 'center',
//   },

//   faqContainer: {
//     gap: 12,
//   },

//   faqItem: {
//     backgroundColor: colors.cardBackground,
//     borderRadius: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: ORANGE,
//     overflow: 'hidden',
//   },

//   faqHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },

//   faqNumber: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: ORANGE,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },

//   faqNumberText: {
//     color: colors.textColor,
//     fontWeight: '700',
//     fontSize: 14,
//   },

//   faqQuestion: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: '600',
//     color: colors.textColor,
//     lineHeight: 20,
//   },

//   faqToggle: {
//     fontSize: 28,
//     color: ORANGE,
//     fontWeight: '300',
//     marginLeft: 8,
//   },

//   faqAnswerContainer: {
//     paddingHorizontal: 60,
//     paddingBottom: 16,
//   },

//   faqAnswer: {
//     fontSize: 14,
//     color: colors.subtitleColor,
//     lineHeight: 22,
//   },

//   endContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//     paddingBottom: 100,
//   },

//   endEmoji: {
//     fontSize: 80,
//     marginBottom: 24,
//   },

//   endTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: colors.textColor,
//     marginBottom: 8,
//   },

//   endSubtitle: {
//     fontSize: 16,
//     color: ORANGE,
//     marginBottom: 32,
//   },

//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 32,
//     justifyContent: 'center',
//   },

//   tag: {
//     backgroundColor: colors.optionBackground,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 16,
//   },

//   tagText: {
//     fontSize: 12,
//     color: ORANGE,
//     fontWeight: '600',
//   },

//   doneButton: {
//     backgroundColor: ORANGE,
//     paddingHorizontal: 40,
//     paddingVertical: 14,
//     borderRadius: 24,
//   },

//   doneButtonText: {
//     color: colors.textColor,
//     fontSize: 15,
//     fontWeight: '700',
//   },

//   slideCounter: {
//     position: 'absolute',
//     bottom: 40,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 16,
//   },

//   slideCounterText: {
//     color: colors.textColor,
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   xpAnimationContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.9)',
//   },

//   xpAnimationBadge: {
//     backgroundColor: colors.cardBackground,
//     paddingHorizontal: 48,
//     paddingVertical: 32,
//     borderRadius: 24,
//     alignItems: 'center',
//   },

//   xpAnimationEmoji: {
//     fontSize: 64,
//     marginBottom: 16,
//   },

//   xpAnimationTitle: {
//     fontSize: 36,
//     fontWeight: '700',
//     color: ORANGE,
//     marginBottom: 8,
//   },

//   xpAnimationSubtitle: {
//     fontSize: 14,
//     color: colors.subtitleColor,
//   },
// });

// export default ArticleStoryView;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Linking,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { colors } from '../../../src/theme/globalStyles';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF6300';

const ArticleStoryView = () => {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [hasAwardedXP, setHasAwardedXP] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [scrolling, setScrolling] = useState(false);
  const xpScale = useRef(new Animated.Value(0)).current;
  const tapStartY = useRef(0);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const articleRef = doc(db, 'products', 'gowiser', 'articles', articleId);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        const articleData = { id: articleSnap.id, ...articleSnap.data() };
        setArticle(articleData);
        
        await updateDoc(articleRef, {
          views: increment(1)
        });

        createSlides(articleData);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSlides = (articleData) => {
    const slidesList = [];

    slidesList.push({
      type: 'intro',
      content: {
        title: articleData.title,
        description: articleData.description,
        image: articleData.titleImage,
        author: articleData.author?.name || 'Admin',
        minRead: articleData.minRead,
        category: articleData.category
      }
    });

    const sections = extractSections(articleData.body);
    
    if (sections.length > 0) {
      sections.forEach((section) => {
        slidesList.push({
          type: 'content',
          content: section
        });
      });
    } else {
      const bodyContent = cleanHtmlContent(articleData.body);
      const paragraphs = bodyContent.split('\n\n').filter(p => p.trim().length > 0);
      const chunkSize = 3;
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        slidesList.push({
          type: 'content',
          content: {
            title: '',
            parts: paragraphs.slice(i, i + chunkSize).map(p => ({ text: p, normal: true }))
          }
        });
      }
    }

    if (articleData.socialMediaPosts && articleData.socialMediaPosts.length > 0) {
      slidesList.push({
        type: 'social',
        content: articleData.socialMediaPosts
      });
    }

    if (articleData.faqHtml) {
      const faqs = extractFAQs(articleData.faqHtml);
      if (faqs.length > 0) {
        slidesList.push({
          type: 'faq',
          content: faqs
        });
      }
    }

    slidesList.push({
      type: 'end',
      content: {
        xp: articleData.xp,
        tags: articleData.tags || []
      }
    });

    setSlides(slidesList);
  };

  const cleanHtmlContent = (html) => {
    if (!html) return '';
    
    let text = html;
    
    text = text.replace(/<li[^>]*>/gi, '\n• ');
    text = text.replace(/<\/li>/gi, '');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<h3[^>]*>/gi, '\n');
    text = text.replace(/<\/h3>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/  +/g, ' ');
    text = text.replace(/\n\n+/g, '\n\n');
    
    return text.trim();
  };

  const extractSections = (html) => {
    const sections = [];
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    
    let matches = [...html.matchAll(h2Regex)];
    
    matches.forEach((match, index) => {
      const title = cleanHtmlContent(match[1]);
      const startIndex = match.index + match[0].length;
      const endIndex = matches[index + 1]?.index || html.length;
      const content = html.substring(startIndex, endIndex);
      const parts = parseContentWithFormatting(content);
      
      sections.push({
        title: title,
        parts: parts
      });
    });

    return sections;
  };

  const parseContentWithFormatting = (html) => {
    const parts = [];
    let tempHtml = html;
    
    tempHtml = tempHtml.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
      if (items) {
        return '\n' + items.map(item => 
          '• ' + item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
        ).join('\n');
      }
      return match;
    });
    
    tempHtml = tempHtml.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
      if (items) {
        return '\n' + items.map((item, idx) => 
          `${idx + 1}. ` + item.replace(/<li[^>]*>|<\/li>/gi, '').trim()
        ).join('\n');
      }
      return match;
    });
    
    const segments = tempHtml.split(/(<(?:strong|b|em|i|h3)[^>]*>.*?<\/(?:strong|b|em|i|h3)>)/gi);
    
    segments.forEach(segment => {
      if (!segment.trim()) return;
      
      if (/<(strong|b)>(.*?)<\/(strong|b)>/i.test(segment)) {
        const text = cleanHtmlContent(segment);
        if (text) parts.push({ text, bold: true });
      } else if (/<(em|i)>(.*?)<\/(em|i)>/i.test(segment)) {
        const text = cleanHtmlContent(segment);
        if (text) parts.push({ text, italic: true });
      } else if (/<h3>(.*?)<\/h3>/i.test(segment)) {
        const text = cleanHtmlContent(segment);
        if (text) parts.push({ text, heading: true });
      } else {
        const text = cleanHtmlContent(segment);
        if (text) parts.push({ text, normal: true });
      }
    });
    
    return parts;
  };

  const extractFAQs = (faqHtml) => {
    const faqs = [];
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gi;
    
    let matches = [...faqHtml.matchAll(h3Regex)];
    
    matches.forEach((match) => {
      faqs.push({
        question: cleanHtmlContent(match[1]),
        answer: cleanHtmlContent(match[2])
      });
    });

    return faqs;
  };

  const getYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleTouchStart = (event) => {
    tapStartY.current = event.nativeEvent.pageY;
  };

  const handleTouchEnd = (event) => {
    if (scrolling) return;
    
    const touchEndY = event.nativeEvent.pageY;
    const verticalMovement = Math.abs(touchEndY - tapStartY.current);
    
    if (verticalMovement > 10) return;
    
    const { locationX } = event.nativeEvent;
    const leftZone = width * 0.3;
    const rightZone = width * 0.7;

    if (locationX < leftZone && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    } else if (locationX > rightZone && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      
      if (currentSlide === slides.length - 2 && !hasAwardedXP) {
        awardXP();
      }
    }
  };

  const awardXP = async () => {
    setHasAwardedXP(true);
    setShowXPAnimation(true);
    
    Animated.sequence([
      Animated.spring(xpScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(xpScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowXPAnimation(false);
    });
  };

  const renderFormattedContent = (parts) => {
    return parts.map((part, index) => {
      if (part.bold) {
        return <Text key={index} style={styles.boldText}>{part.text}</Text>;
      } else if (part.italic) {
        return <Text key={index} style={styles.italicText}>{part.text}</Text>;
      } else if (part.heading) {
        return <Text key={index} style={styles.h3Text}>{'\n'}{part.text}{'\n'}</Text>;
      } else {
        return <Text key={index}>{part.text}</Text>;
      }
    });
  };

  const renderSlide = (slide, index) => {
    switch (slide.type) {
      case 'intro':
        return (
          <View style={styles.slideContainer}>
            {slide.content.image && (
              <Image
                source={{ uri: slide.content.image }}
                style={styles.introImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.introOverlay}>
              {slide.content.category && (
                <View style={styles.categoryBadgeWrapper}>
                  <Text style={styles.categoryBadge}>{slide.content.category}</Text>
                </View>
              )}
              <Text style={styles.introTitle}>{slide.content.title}</Text>
              <Text style={styles.introDescription}>{slide.content.description}</Text>
              <View style={styles.introMeta}>
                <Text style={styles.metaText}>By {slide.content.author}</Text>
                <Text style={styles.metaText}>•</Text>
                <Text style={styles.metaText}>{slide.content.minRead} min read</Text>
              </View>
            </View>
          </View>
        );

      case 'content':
        return (
          <View style={styles.slideContainer}>
            <ScrollView 
              style={styles.contentScroll}
              contentContainerStyle={styles.contentScrollInner}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => setScrolling(true)}
              onScrollEndDrag={() => setTimeout(() => setScrolling(false), 100)}
            >
              {slide.content.title && (
                <Text style={styles.contentTitle}>{slide.content.title}</Text>
              )}
              <Text style={styles.contentText}>
                {renderFormattedContent(slide.content.parts)}
              </Text>
            </ScrollView>
          </View>
        );

      case 'social':
        return (
          <View style={styles.slideContainer}>
            <ScrollView 
              style={styles.contentScroll}
              contentContainerStyle={styles.contentScrollInner}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => setScrolling(true)}
              onScrollEndDrag={() => setTimeout(() => setScrolling(false), 100)}
            >
              <Text style={styles.sectionTitle}>Related Content</Text>
              <Text style={styles.sectionSubtitle}>Check out these resources for more insights</Text>
              
              <View style={styles.socialContainer}>
                {slide.content.map((post, idx) => {
                  const videoId = post.platform === 'youtube' ? getYouTubeVideoId(post.url) : null;
                  
                  return (
                    <View key={idx} style={styles.socialCard}>
                      {videoId ? (
                        <>
                          <Text style={styles.socialMediaHeading}>📺 Watch on YouTube</Text>
                          <TouchableOpacity
                            style={styles.youtubePreview}
                            onPress={() => Linking.openURL(post.url)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }}
                              style={styles.youtubeThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.playButton}>
                              <Text style={styles.playIcon}>▶</Text>
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Text style={styles.socialMediaHeading}>
                            {post.platform === 'instagram' ? '📸 View on Instagram' :
                             post.platform === 'twitter' ? '🐦 Read on Twitter' : 
                             '💼 View on LinkedIn'}
                          </Text>
                          <TouchableOpacity
                            style={styles.socialLink}
                            onPress={() => Linking.openURL(post.url)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.socialIcon}>
                              <Text style={styles.socialEmoji}>
                                {post.platform === 'instagram' ? '📸' :
                                 post.platform === 'twitter' ? '🐦' : '💼'}
                              </Text>
                            </View>
                            <View style={styles.socialContent}>
                              <Text style={styles.socialPlatform}>{post.platform}</Text>
                              <Text style={styles.socialUrl} numberOfLines={1}>Tap to open</Text>
                            </View>
                            <Text style={styles.socialArrow}>→</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      case 'faq':
        return (
          <View style={styles.slideContainer}>
            <ScrollView 
              style={styles.contentScroll}
              contentContainerStyle={styles.contentScrollInner}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => setScrolling(true)}
              onScrollEndDrag={() => setTimeout(() => setScrolling(false), 100)}
            >
              <Text style={styles.faqMainTitle}>Frequently Asked Questions</Text>
              <Text style={styles.faqSubtitle}>Everything you need to know</Text>
              
              <View style={styles.faqContainer}>
                {slide.content.map((faq, idx) => (
                  <View key={idx} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqNumber}>
                        <Text style={styles.faqNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Text style={styles.faqToggle}>
                        {expandedFAQ === idx ? '−' : '+'}
                      </Text>
                    </TouchableOpacity>
                    
                    {expandedFAQ === idx && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 'end':
        return (
          <View style={styles.slideContainer}>
            <View style={styles.endContent}>
              <Text style={styles.endEmoji}>🎉</Text>
              <Text style={styles.endTitle}>Article Complete!</Text>
              <Text style={styles.endSubtitle}>You've earned {slide.content.xp} XP</Text>
              
              {slide.content.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {slide.content.tags.map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>Back to Articles</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!article || slides.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
          <Text style={styles.backButtonTextError}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View 
        style={styles.container}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.progressBars}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressBarSegment,
                  index <= currentSlide && styles.progressBarSegmentActive
                ]}
              />
            ))}
          </View>
          
          <View style={styles.xpBadgeTop}>
            <Text style={styles.xpBadgeText}>🎯 {article.xp} XP</Text>
          </View>
        </View>

        {renderSlide(slides[currentSlide], currentSlide)}

        <View style={styles.slideCounter}>
          <Text style={styles.slideCounterText}>
            {currentSlide + 1} / {slides.length}
          </Text>
        </View>

        {showXPAnimation && (
          <Animated.View
            style={[
              styles.xpAnimationContainer,
              {
                transform: [{ scale: xpScale }],
                opacity: xpScale,
              },
            ]}
          >
            <View style={styles.xpAnimationBadge}>
              <Text style={styles.xpAnimationEmoji}>🎉</Text>
              <Text style={styles.xpAnimationTitle}>+{article.xp} XP</Text>
              <Text style={styles.xpAnimationSubtitle}>Keep learning!</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundColor,
  },

  loadingText: {
    color: colors.textColor,
    marginTop: 16,
    fontSize: 16,
  },

  errorText: {
    color: colors.textColor,
    fontSize: 18,
    marginBottom: 20,
  },

  backButtonError: {
    backgroundColor: ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonTextError: {
    color: colors.textColor,
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    color: colors.textColor,
    fontSize: 18,
    fontWeight: '600',
  },

  progressBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 12,
  },

  progressBarSegment: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },

  progressBarSegmentActive: {
    backgroundColor: ORANGE,
  },

  xpBadgeTop: {
    backgroundColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  xpBadgeText: {
    color: colors.textColor,
    fontSize: 11,
    fontWeight: '700',
  },

  slideContainer: {
    flex: 1,
    paddingTop: 100,
  },

  introImage: {
    width: width,
    height: height * 0.45,
    position: 'absolute',
    top: 100,
  },

  introOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
    justifyContent: 'flex-end',
    paddingTop: height * 0.45 + 100,
    paddingBottom: 40,
  },

  categoryBadgeWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  categoryBadge: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '700',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  introTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 12,
    lineHeight: 34,
  },

  introDescription: {
    fontSize: 15,
    color: colors.textColor,
    lineHeight: 22,
    marginBottom: 12,
  },

  introMeta: {
    flexDirection: 'row',
    gap: 8,
  },

  metaText: {
    fontSize: 12,
    color: colors.textColor,
    opacity: 0.8,
  },

  contentScroll: {
    flex: 1,
  },

  contentScrollInner: {
    padding: 24,
    paddingBottom: 120,
  },

  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textColor,
    lineHeight: 32,
    marginBottom: 16,
  },

  contentText: {
    fontSize: 16,
    color: colors.textColor,
    lineHeight: 26,
  },

  boldText: {
    fontWeight: '700',
    color: ORANGE,
  },

  italicText: {
    fontStyle: 'italic',
  },

  h3Text: {
    fontSize: 18,
    fontWeight: '700',
    color: ORANGE,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: colors.subtitleColor,
    marginBottom: 20,
  },

  socialContainer: {
    gap: 20,
  },

  socialCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    padding: 16,
  },

  socialMediaHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: ORANGE,
    marginBottom: 12,
  },

  youtubePreview: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },

  youtubeThumbnail: {
    width: '100%',
    height: '100%',
  },

  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 99, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  playIcon: {
    fontSize: 24,
    color: colors.textColor,
    marginLeft: 4,
  },

  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.optionBackground,
    padding: 12,
    borderRadius: 12,
  },

  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  socialEmoji: {
    fontSize: 24,
  },

  socialContent: {
    flex: 1,
  },

  socialPlatform: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textColor,
    textTransform: 'capitalize',
    marginBottom: 4,
  },

  socialUrl: {
    fontSize: 12,
    color: colors.subtitleColor,
  },

  socialArrow: {
    fontSize: 20,
    color: ORANGE,
  },

  faqMainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 8,
    textAlign: 'center',
  },

  faqSubtitle: {
    fontSize: 14,
    color: colors.subtitleColor,
    marginBottom: 24,
    textAlign: 'center',
  },

  faqContainer: {
    gap: 12,
  },

  faqItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    overflow: 'hidden',
  },

  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  faqNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  faqNumberText: {
    color: colors.textColor,
    fontWeight: '700',
    fontSize: 14,
  },

  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textColor,
    lineHeight: 20,
  },

  faqToggle: {
    fontSize: 28,
    color: ORANGE,
    fontWeight: '300',
    marginLeft: 8,
  },

  faqAnswerContainer: {
    paddingHorizontal: 60,
    paddingBottom: 16,
  },

  faqAnswer: {
    fontSize: 14,
    color: colors.subtitleColor,
    lineHeight: 22,
  },

  endContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100,
  },

  endEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },

  endTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 8,
  },

  endSubtitle: {
    fontSize: 16,
    color: ORANGE,
    marginBottom: 32,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
    justifyContent: 'center',
  },

  tag: {
    backgroundColor: colors.optionBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  tagText: {
    fontSize: 12,
    color: ORANGE,
    fontWeight: '600',
  },

  doneButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 24,
  },

  doneButtonText: {
    color: colors.textColor,
    fontSize: 15,
    fontWeight: '700',
  },

  slideCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  slideCounterText: {
    color: colors.textColor,
    fontSize: 12,
    fontWeight: '600',
  },

  xpAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },

  xpAnimationBadge: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: 'center',
  },

  xpAnimationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },

  xpAnimationTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: ORANGE,
    marginBottom: 8,
  },

  xpAnimationSubtitle: {
    fontSize: 14,
    color: colors.subtitleColor,
  },
});

export default ArticleStoryView;
