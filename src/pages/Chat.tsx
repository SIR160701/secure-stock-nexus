
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Settings, Loader2, Zap } from 'lucide-react';
import { ChatService, ChatMessage } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant IA spécialisé dans la gestion de stock et d\'équipements Secure Stock. Je peux vous aider avec :\n\n• Gestion des articles et catégories\n• Procédures de maintenance\n• Attribution d\'équipements\n• Analyses et rapports\n• Questions techniques\n\nComment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatService, setChatService] = useState<ChatService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Configuration automatique avec la clé API fournie
    const apiKey = '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';
    setChatService(new ChatService({ 
      apiKey,
      model: 'gpt-4',
      maxTokens: 800 
    }));
    
    toast({
      title: 'Connexion établie',
      description: 'ChatGPT 4.0 est maintenant connecté et prêt à vous aider.',
    });
  }, []);

  useEffect(() => {
    // Auto-scroll vers le bas
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatService) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage([...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur de communication avec l\'IA',
        variant: 'destructive'
      });
      
      // Message d'erreur pour l'utilisateur
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant IA spécialisé dans la gestion de stock et d\'équipements Secure Stock. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date()
      }
    ]);
  };

  const quickQuestions = [
    "Comment gérer les seuils critiques ?",
    "Procédure d'attribution d'équipement",
    "Planifier une maintenance préventive",
    "Analyser les données de stock"
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-pink-900 to-purple-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assistant IA Secure Stock</h1>
            <p className="text-pink-100">Assistant intelligent spécialisé dans la gestion de stock et d'équipements</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Bot className="h-8 w-8" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">GPT-4.0 Connecté</span>
              </div>
              <p className="text-sm text-pink-100">Prêt à vous aider</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Questions rapides
          </CardTitle>
          <CardDescription>Cliquez sur une question pour commencer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3 text-left"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Chat en temps réel</CardTitle>
                <CardDescription>Assistant IA spécialisé en gestion de stock</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                En ligne
              </Badge>
              <Button variant="outline" size="sm" onClick={clearChat}>
                Nouveau chat
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-6 mb-6 max-h-96 p-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white text-gray-900 border shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-sm">L'assistant analyse votre demande...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3 p-4 bg-white rounded-lg border shadow-sm">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question sur la gestion de stock..."
              disabled={isLoading}
              className="flex-1 border-0 focus-visible:ring-0 text-base"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
