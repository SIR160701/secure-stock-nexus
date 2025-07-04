
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Trash2, Bot } from 'lucide-react';
import { useChatGPT } from '@/hooks/useChatGPT';
import { ChatMessage } from '@/components/ChatMessage';

const Chat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useChatGPT();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
              Assistant IA - Gestion
            </h1>
            <p className="text-purple-100">Chatbot spécialisé en gestion de stock et d'équipements</p>
          </div>
            <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-medium">Gemini AI connecté</span>
            </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col border-0 shadow-xl">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Conversation
              </CardTitle>
              <CardDescription>
                Posez vos questions sur la gestion de stock, maintenance, employés...
              </CardDescription>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearMessages}>
                <Trash2 className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px] max-h-[600px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bonjour ! Comment puis-je vous aider ?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Je suis spécialisé dans la gestion de stock, maintenance et équipements.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendMessage("Comment optimiser mon stock ?")}
                      disabled={isLoading}
                    >
                      Optimiser le stock
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendMessage("Procédures de maintenance préventive")}
                      disabled={isLoading}
                    >
                      Maintenance préventive
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendMessage("Gestion des équipements employés")}
                      disabled={isLoading}
                    >
                      Équipements employés
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendMessage("Bonnes pratiques organisationnelles")}
                      disabled={isLoading}
                    >
                      Bonnes pratiques
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur la gestion..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
