
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useChatGPT = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les messages depuis localStorage au démarrage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDateObjects = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDateObjects);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    }
  }, []);

  // Sauvegarder les messages dans localStorage à chaque changement
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async ({ userMessage, currentMessages }: { userMessage: ChatMessage; currentMessages: ChatMessage[] }) => {
      const { data, error } = await supabase.functions.invoke('chat-gpt-enhanced', {
        body: { 
          messages: [...currentMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
      });

      if (error) throw error;
      return data.content;
    },
    onMutate: async ({ userMessage }) => {
      // Optimistic update : ajouter immédiatement le message utilisateur
      setMessages(prev => [...prev, userMessage]);
      return { userMessage };
    },
    onSuccess: (assistantContent, { userMessage }) => {
      // Ajouter la réponse de l'assistant
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error, variables, context) => {
      console.error('Erreur chat:', error);
      
      // Annuler l'optimistic update en supprimant le message utilisateur qui a échoué
      if (context?.userMessage) {
        setMessages(prev => prev.filter(msg => msg.id !== context.userMessage.id));
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec l'assistant IA.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    mutation.mutate({ 
      userMessage, 
      currentMessages: messages 
    });
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
  };

  return {
    messages,
    isLoading: mutation.isPending,
    sendMessage,
    clearMessages,
  };
};
