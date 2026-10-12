import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

import { Brand, Radius, Shadow } from '@/constants/brand';
import { API_URL, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const SUGGESTIONS = [
  'Quel est le niveau de risque actuel ?',
  'Comment signaler une inondation ?',
  'Que faire avant une inondation ?',
  'Comment lire la carte des zones ?',
];

const GREETING = {
  id: '0',
  role: 'assistant' as const,
  text: "Bonjour, je suis NDAM. Je peux vous renseigner sur le risque d'inondation à Thiaroye-sur-Mer, vous aider à signaler un incident ou vous donner des conseils de prévention. Comment puis-je vous aider ?",
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { isDark, colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.post(`${API_URL}/chat/`, { question: q }, authHeaders);
      const replyText = res.data?.reply || "Je n'ai pas pu obtenir de réponse. Veuillez réessayer.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error('Erreur chatbot NDAM:', e);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Désolé, je rencontre des difficultés de connexion. Veuillez réessayer dans un instant.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });
    return () => {
      showSub.remove();
    };
  }, []);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View
            style={[
              styles.avatarNdam,
              { backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT },
            ]}>
            <MaterialIcons
              name="waves"
              size={15}
              color={isDark ? Brand.navy.DEFAULT : '#FFFFFF'}
            />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [
                  styles.bubbleUser,
                  isDark && { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
                ]
              : [
                  styles.bubbleAssistant,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ],
          ]}>
          <Text
            style={[
              styles.bubbleText,
              isUser
                ? [styles.bubbleTextUser, isDark && { color: Brand.navy.DEFAULT }]
                : [styles.bubbleTextAssistant, { color: colors.text }],
            ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}>
        {/* En-tête avec bouton retour flèche à gauche */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={handleGoBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
                borderColor: colors.border,
              },
            ]}
            accessibilityLabel="Retour"
            accessibilityRole="button">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View
            style={[
              styles.avatarHeader,
              { backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT },
            ]}>
            <MaterialIcons
              name="waves"
              size={18}
              color={isDark ? Brand.navy.DEFAULT : '#FFFFFF'}
            />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>Assistant NDAM</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>IA de prévention & gestion des inondations</Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>En ligne</Text>
          </View>
        </View>

        {/* Liste des messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListFooterComponent={
            loading ? (
              <View style={[styles.msgRow, styles.msgRowAssistant]}>
                <View
                  style={[
                    styles.avatarNdam,
                    { backgroundColor: isDark ? '#FFFFFF' : Brand.navy.DEFAULT },
                  ]}>
                  <MaterialIcons
                    name="waves"
                    size={15}
                    color={isDark ? Brand.navy.DEFAULT : '#FFFFFF'}
                  />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAssistant,
                    styles.typingBubble,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}>
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : Brand.navy.DEFAULT} />
                  <Text style={[styles.typingText, { color: colors.textMuted }]}>NDAM analyse la situation...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions rapides (uniquement si début de discussion) */}
        {messages.length <= 2 && (
          <View
            style={[
              styles.suggestionsContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}>
            <Text style={[styles.suggestionsTitle, { color: colors.textMuted }]}>Suggestions rapides :</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((s, index) => (
                <Pressable
                  key={index}
                  onPress={() => sendMessage(s)}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: isDark ? Brand.navy[900] : Brand.navy[50],
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text style={[styles.suggestionChipText, { color: colors.text }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Zone de saisie */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? Brand.navy[900] : '#FFFFFF',
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Posez votre question à NDAM..."
            placeholderTextColor={colors.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            blurOnSubmit={false}
            maxLength={500}
            editable={!loading}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}>
            <Feather name="send" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Brand.navy[100],
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.navy[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.navy[100],
  },
  avatarHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.navy.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: Brand.navy.DEFAULT },
  subtitle: { fontSize: 11, color: Brand.navy[400], marginTop: 1 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  onlineText: { fontSize: 10, fontWeight: '700', color: '#166534' },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 6,
  },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },

  avatarNdam: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.navy.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Brand.navy.DEFAULT,
    borderBottomRightRadius: 2,
  },
  bubbleAssistant: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Brand.navy[100],
    ...Shadow.card,
  },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  bubbleTextUser: { color: '#ffffff' },
  bubbleTextAssistant: { color: Brand.navy.DEFAULT },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: { fontSize: 12, color: Brand.navy[400] },

  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Brand.navy[50],
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.navy[400],
    marginBottom: 6,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: Brand.navy[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Brand.navy[100],
  },
  suggestionChipText: {
    fontSize: 11,
    color: Brand.navy[600],
    fontWeight: '500',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Brand.navy[100],
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Brand.red.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13.5,
    color: Brand.navy.DEFAULT,
    maxHeight: 90,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.red.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
    backgroundColor: Brand.navy[200],
  },
});
